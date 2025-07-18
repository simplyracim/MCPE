import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';

export default function OrderForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    customer_name: '',
    status: 'pending',
    items: [],
  });

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [componentDetails, setComponentDetails] = useState({});

  // Fetch products for the dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchProducts();
  }, []);

  // Fetch order data if in edit mode
  useEffect(() => {
    if (isEdit) {
      const fetchOrder = async () => {
        try {
          const response = await fetch(`http://localhost:4000/api/orders/${id}`);
          if (!response.ok) throw new Error('Failed to fetch order');
          const data = await response.json();
          
          // Map the data to match our form structure
          setFormData({
            customer_name: data.customer_name,
            status: data.status,
            items: data.products ? data.products.map(p => ({
              productId: p.id,
              name: p.name,
              price: p.sell_price,
              quantity: p.product_orders.quantity,
              buy_price: p.buy_price
            })) : []
          });
          
          // Pre-calculate component details for existing items
          if (data.products) {
            const details = {};
            for (const p of data.products) {
              details[p.id] = await calculateComponents(p.id, p.product_orders.quantity);
            }
            setComponentDetails(details);
          }
        } catch (err) {
          setError(err.message);
        }
      };
      fetchOrder();
    }
  }, [id, isEdit]);

  // Recursively fetch components and calculate costs
  const calculateComponents = async (productId, qty = 1) => {
    try {
      const response = await fetch(`http://localhost:4000/api/products/${productId}/components`);
      if (!response.ok) throw new Error('Failed to fetch components');
      const components = await response.json();
      
      if (components.length === 0) {
        // Base product - no components
        const product = products.find(p => p.id === productId) || {};
        return {
          totalCost: (product.buy_price || 0) * qty,
          totalRevenue: (product.sell_price || 0) * qty,
          components: [],
          quantity: qty
        };
      }
      
      // Calculate nested components
      let totalCost = 0;
      const nestedComponents = [];
      
      for (const comp of components) {
        const compDetails = await calculateComponents(comp.final_product_id, qty * comp.rate);
        totalCost += compDetails.totalCost;
        nestedComponents.push({
          ...comp,
          details: compDetails
        });
      }
      
      const product = products.find(p => p.id === productId) || {};
      return {
        totalCost,
        totalRevenue: (product.sell_price || 0) * qty,
        components: nestedComponents,
        quantity: qty
      };
    } catch (err) {
      console.error('Error calculating components:', err);
      return {
        totalCost: 0,
        totalRevenue: 0,
        components: [],
        quantity: qty
      };
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addProduct = async () => {
    if (!selectedProduct || quantity < 1) return;
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const existingItemIndex = formData.items.findIndex(item => item.productId === selectedProduct);
    
    if (existingItemIndex >= 0) {
      // Update quantity if product already in order
      const updatedItems = [...formData.items];
      updatedItems[existingItemIndex].quantity += parseInt(quantity, 10);
      
      // Recalculate components
      const details = await calculateComponents(
        selectedProduct, 
        updatedItems[existingItemIndex].quantity
      );
      
      setFormData(prev => ({
        ...prev,
        items: updatedItems
      }));
      
      setComponentDetails(prev => ({
        ...prev,
        [selectedProduct]: details
      }));
    } else {
      // Add new product to order
      const details = await calculateComponents(selectedProduct, parseInt(quantity, 10));
      
      setFormData(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            productId: product.id,
            name: product.name,
            price: product.sell_price,
            quantity: parseInt(quantity, 10),
            buy_price: product.buy_price
          }
        ]
      }));
      
      setComponentDetails(prev => ({
        ...prev,
        [selectedProduct]: details
      }));
    }
    
    // Reset form
    setSelectedProduct('');
    setQuantity(1);
  };

  const removeProduct = (productId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== productId)
    }));
    
    setComponentDetails(prev => {
      const newDetails = {...prev};
      delete newDetails[productId];
      return newDetails;
    });
  };

  const calculateTotal = () => {
    const itemsTotal = formData.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    return itemsTotal.toFixed(2);
  };

  const calculateProfit = () => {
    return formData.items.reduce((sum, item) => {
      const itemDetails = componentDetails[item.productId] || {};
      const revenue = itemDetails.totalRevenue || (item.price * item.quantity);
      const cost = itemDetails.totalCost || (item.buy_price * item.quantity) || 0;
      return sum + (revenue - cost);
    }, 0).toFixed(2);
  };

  const calculateCost = () => {
    return formData.items.reduce((sum, item) => {
      const itemDetails = componentDetails[item.productId] || {};
      return sum + (itemDetails.totalCost || (item.buy_price * item.quantity) || 0);
    }, 0).toFixed(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (formData.items.length === 0) {
        throw new Error('Please add at least one product to the order');
      }

      const orderData = {
        customer_name: formData.customer_name,
        status: formData.status,
        products: formData.items.map(item => ({
          product_id: item.productId,
          quantity: item.quantity
        }))
      };

      const url = isEdit 
        ? `http://localhost:4000/api/orders/${id}`
        : 'http://localhost:4000/api/orders';
      
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
      }

      navigate('/orders');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderComponentTree = (component, level = 0) => {
    return (
      <div key={`${component.final_product_id}-${level}`} className="ml-4 pl-4 border-l-2 border-gray-200">
        <div className="flex justify-between py-1">
          <span>
            {products.find(p => p.id === component.final_product_id)?.name || `Product ${component.final_product_id}`}
          </span>
          <span className="text-gray-600">
            {component.rate} x {component.details.quantity} = {(component.rate * component.details.quantity).toFixed(2)}
          </span>
        </div>
        {component.details.components.map(comp => renderComponentTree(comp, level + 1))}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          {isEdit ? 'Edit Order' : 'Create New Order'}
        </h2>
        <p className="text-gray-600">
          {isEdit 
            ? 'Update order details'
            : 'Fill in the details to create a new order'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Customer Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="customer_name">Name *</Label>
              <Input
                id="customer_name"
                name="customer_name"
                value={formData.customer_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Order Details</h3>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                name="status" 
                value={formData.status} 
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-medium mb-4">Order Items</h3>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
              <div className="md:col-span-5">
                <Label htmlFor="product">Product</Label>
                <Select 
                  value={selectedProduct}
                  onValueChange={setSelectedProduct}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} (${product.sell_price})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="md:col-span-3">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
                />
              </div>
              
              <div className="md:col-span-4 flex items-end">
                <Button 
                  type="button" 
                  onClick={addProduct}
                  className="w-full md:w-auto"
                >
                  Add to Order
                </Button>
              </div>
            </div>

            {formData.items.length > 0 ? (
              <div className="border-t border-gray-200 mt-4 pt-4">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Qty
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formData.items.map((item) => (
                        <tr key={item.productId}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.name}
                              {componentDetails[item.productId]?.components?.length > 0 && (
                                <div className="mt-2 text-xs text-gray-500">
                                  {renderComponentTree({
                                    final_product_id: item.productId,
                                    rate: 1,
                                    details: componentDetails[item.productId]
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              ${item.price.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {item.quantity}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              type="button"
                              onClick={() => removeProduct(item.productId)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 border-t border-gray-200 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium text-gray-600">Subtotal:</span>
                      <span className="text-sm font-medium">
                        ${calculateTotal()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between pt-2">
                      <span className="text-sm font-medium text-gray-600">Total Cost:</span>
                      <span className="text-sm font-medium">
                        ${calculateCost()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-base font-semibold">Estimated Profit:</span>
                      <span className="text-base font-semibold">
                        ${calculateProfit()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No items added to this order yet. Select a product and click "Add to Order".
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => navigate('/orders')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading || formData.items.length === 0}
          >
            {loading ? 'Saving...' : isEdit ? 'Update Order' : 'Create Order'}
          </Button>
        </div>
      </form>
    </div>
  );
}