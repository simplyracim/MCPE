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
  const [selectedProduct, setSelectedProduct] = useState(undefined);
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

  // Calculate costs from product tree
  const calculateComponents = async (productId, qty = 1, parentRate = 1) => {
    try {
      // Get the base product details
      const product = products.find(p => p.id === Number(productId));
      if (!product) {
        console.error(`Product ${productId} not found`);
        return {
          totalCost: 0,
          totalRevenue: 0,
          components: [],
          quantity: qty,
          rate: parentRate
        };
      }

      // Recursive function to calculate costs from the product tree
      const calculateCosts = (product, quantity, rate = 1) => {
        let totalCost = 0;
        const components = [];
        
        // If product has components, calculate their total cost
        if (product.components && product.components.length > 0) {
          product.components.forEach(comp => {
            const compCost = calculateCosts(comp, quantity * comp.rate, comp.rate);
            totalCost += compCost.totalCost;
            components.push(compCost);
          });
        } else {
          // Base component - use buy price
          totalCost = (Number(product.buy_price) || 0) * quantity;
        }
        
        return {
          ...product,
          totalCost,
          totalRevenue: (Number(product.sell_price) || 0) * quantity,
          components,
          quantity,
          rate
        };
      };
      
      return calculateCosts(product, qty, parentRate);
      
    } catch (error) {
      console.error('Error calculating components:', error);
      return {
        totalCost: 0,
        totalRevenue: 0,
        components: [],
        quantity: qty,
        rate: parentRate
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
    console.log('Add product clicked', { selectedProduct, quantity });
    
    if (!selectedProduct || quantity < 1) {
      console.log('No product selected or invalid quantity');
      return;
    }
    
    try {
      // Convert selectedProduct to number for comparison since IDs are numbers
      const productId = Number(selectedProduct);
      const qty = Number(quantity);
      const product = products.find(p => p.id === productId);
      
      if (!product) {
        console.error('Product not found:', productId);
        return;
      }

      // Check if product is already in the order
      const existingItemIndex = formData.items.findIndex(item => item.productId === productId);
      
      if (existingItemIndex >= 0) {
        // Update quantity if product already in order
        const updatedItems = [...formData.items];
        const newQuantity = updatedItems[existingItemIndex].quantity + qty;
        
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: newQuantity
        };
        
        setFormData(prev => ({
          ...prev,
          items: updatedItems
        }));
        
        // Update component details with new quantities
        const updatedDetails = await calculateComponents(productId, newQuantity);
        setComponentDetails(prev => ({
          ...prev,
          [productId]: updatedDetails
        }));
      } else {
        // Calculate component details for the new product
        const details = await calculateComponents(productId, qty);
        
        // Add new product to order
        const newProduct = {
          productId,
          name: product.name,
          price: Number(product.sell_price) || 0,
          quantity: qty,
          buy_price: Number(product.buy_price) || 0,
          description: product.description
        };
        
        setFormData(prev => ({
          ...prev,
          items: [...prev.items, newProduct]
        }));
        
        // Add component details for the new product
        setComponentDetails(prev => ({
          ...prev,
          [productId]: details
        }));
      }
      
      // Reset form
      setSelectedProduct('');
      setQuantity(1);
      
    } catch (error) {
      console.error('Error adding product:', error);
      setError('Failed to add product. Please try again.');
    }
  };

  const removeProduct = (productId) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.productId !== Number(productId))
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
    if (!component) return null;
    
    const displayRate = component.rate ? `${component.rate} × ` : '';
    const displayTotal = ((component.rate || 1) * (component.quantity || 1)).toFixed(2);
    const totalCost = component.totalCost || 0;
    
    return (
      <div key={`${component.id}-${level}`} className="ml-4 pl-4 border-l-2 border-gray-200">
        <div className="flex justify-between py-1 items-center">
          <div className="flex-1">
            <span className="font-medium">{component.name || `Product ${component.id}`}</span>
            {component.description && (
              <span className="text-sm text-gray-500 ml-2">({component.description})</span>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {displayRate}{component.quantity || 1} = {displayTotal} units
            </div>
            <div className="text-xs text-gray-500">
              Unit Cost: ${(component.buy_price || 0).toFixed(2)}
            </div>
          </div>
        </div>
        
        {component.components && component.components.length > 0 && (
          <div className="mt-1">
            <div className="text-xs font-medium text-gray-500 mb-1">Components:</div>
            {component.components.map((comp, index) => {
              const componentKey = comp.id ? `${comp.id}-${index}` : `comp-${index}`;
              return (
                <div key={componentKey}>
                  {renderComponentTree(comp, level + 1)}
                </div>
              );
            })}
            <div className="text-xs text-right text-gray-500 mt-1">
              Total Components Cost: ${totalCost.toFixed(2)}
            </div>
          </div>
        )}
        
        {level === 0 && (
          <div className="text-right mt-1">
            <div className="text-sm font-medium">
              Total Cost: ${totalCost.toFixed(2)}
            </div>
            <div className="text-sm">
              Sell Price: ${(component.price * (component.quantity || 1)).toFixed(2)}
            </div>
            <div className="text-sm font-semibold">
              Profit: ${((component.price * (component.quantity || 1)) - totalCost).toFixed(2)}
            </div>
          </div>
        )}
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
                        {product.name} (${Number(product.sell_price).toFixed(2)})
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
                    
                    {/* Cost Breakdown Table */}
                    {formData.items.some(item => componentDetails[item.productId]?.components?.length > 0) && (
                      <div className="mt-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Cost Breakdown:</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cost</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {formData.items.flatMap(item => {
                                const details = componentDetails[item.productId];
                                if (!details?.components) return [];
                                
                                // Flatten all components recursively
                                const flattenComponents = (comps, multiplier = 1) => {
                                  return comps.flatMap(comp => {
                                    const componentQty = (comp.rate || 1) * multiplier * item.quantity;
                                    const children = comp.components?.length > 0 
                                      ? flattenComponents(comp.components, componentQty) 
                                      : [];
                                    
                                    // Only include leaf nodes (actual components with prices)
                                    if (comp.buy_price !== undefined) {
                                      return [{
                                        id: comp.id,
                                        name: comp.name,
                                        unitCost: Number(comp.buy_price) || 0,
                                        quantity: componentQty,
                                        totalCost: (Number(comp.buy_price) || 0) * componentQty
                                      }];
                                    }
                                    return children;
                                  });
                                };
                                
                                return flattenComponents(details.components);
                              })
                              // Group by component ID and sum quantities
                              .reduce((acc, comp) => {
                                const existing = acc.find(c => c.id === comp.id);
                                if (existing) {
                                  existing.quantity += comp.quantity;
                                  existing.totalCost += comp.totalCost;
                                } else {
                                  acc.push({...comp});
                                }
                                return acc;
                              }, [])
                              // Sort by total cost (highest first)
                              .sort((a, b) => b.totalCost - a.totalCost)
                              // Render rows
                              .map((comp, index) => (
                                <tr key={`${comp.id}-${index}`}>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                    {comp.name}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                                    ${comp.unitCost.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 text-right">
                                    {comp.quantity.toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                    ${comp.totalCost.toFixed(2)}
                                  </td>
                                </tr>
                              ))}
                              
                              {/* Total Row */}
                              <tr className="bg-gray-50">
                                <td colSpan="3" className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                                  Total Cost:
                                </td>
                                <td className="px-3 py-2 text-right text-sm font-medium text-gray-900">
                                  ${calculateCost()}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
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