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
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    shippingAddress: '',
    status: 'pending',
    paymentMethod: 'credit_card',
    items: [],
    notes: '',
    shippingCost: '0',
    tax: '0'
  });

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
          setFormData({
            ...data,
            shippingCost: data.shippingCost?.toString() || '0',
            tax: data.tax?.toString() || '0'
          });
        } catch (err) {
          setError(err.message);
        }
      };
      fetchOrder();
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const addProduct = () => {
    if (!selectedProduct || quantity < 1) return;
    
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    const existingItemIndex = formData.items.findIndex(item => item.productId === selectedProduct);
    
    if (existingItemIndex >= 0) {
      // Update quantity if product already in order
      const updatedItems = [...formData.items];
      updatedItems[existingItemIndex].quantity += parseInt(quantity, 10);
      setFormData(prev => ({
        ...prev,
        items: updatedItems
      }));
    } else {
      // Add new product to order
      setFormData(prev => ({
        ...prev,
        items: [
          ...prev.items,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: parseInt(quantity, 10)
          }
        ]
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
  };

  const calculateTotal = () => {
    const itemsTotal = formData.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    const shipping = parseFloat(formData.shippingCost) || 0;
    const tax = parseFloat(formData.tax) || 0;
    
    return (itemsTotal + shipping + tax).toFixed(2);
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
        ...formData,
        shippingCost: parseFloat(formData.shippingCost) || 0,
        tax: parseFloat(formData.tax) || 0,
        total: parseFloat(calculateTotal())
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Customer Information</h3>
            
            <div className="space-y-2">
              <Label htmlFor="customerName">Name *</Label>
              <Input
                id="customerName"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <Input
                id="customerEmail"
                name="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Phone</Label>
              <Input
                id="customerPhone"
                name="customerPhone"
                type="tel"
                value={formData.customerPhone}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shippingAddress">Shipping Address</Label>
              <Input
                id="shippingAddress"
                name="shippingAddress"
                value={formData.shippingAddress}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Order Details</h3>
            
            <div className="grid grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select 
                  name="paymentMethod" 
                  value={formData.paymentMethod} 
                  onValueChange={(value) => setFormData({...formData, paymentMethod: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash on Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Order Notes</Label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.notes}
                onChange={handleChange}
              />
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
                        {product.name} (${product.price})
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
                        ${formData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <div className="flex-1 max-w-xs">
                        <Label htmlFor="shippingCost">Shipping Cost</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                          <Input
                            id="shippingCost"
                            name="shippingCost"
                            type="text"
                            value={formData.shippingCost}
                            onChange={handleNumberChange}
                            className="pl-8"
                          />
                        </div>
                      </div>
                      
                      <div className="flex-1 max-w-xs">
                        <Label htmlFor="tax">Tax</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                          <Input
                            id="tax"
                            name="tax"
                            type="text"
                            value={formData.tax}
                            onChange={handleNumberChange}
                            className="pl-8"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-base font-semibold">Total:</span>
                      <span className="text-base font-semibold">
                        ${calculateTotal()}
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
