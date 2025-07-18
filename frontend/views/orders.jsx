import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/orders');
        if (!response.ok) throw new Error('Failed to fetch orders');
        const data = await response.json();
        
        // Enhance orders with calculated costs and profits
        const enhancedOrders = await Promise.all(data.map(async order => {
          // Calculate total cost and profit for each order
          let totalCost = 0;
          let totalRevenue = 0;
          
          if (order.products) {
            for (const product of order.products) {
              // If backend doesn't provide cost data, we might need to fetch it
              const productCost = product.buy_price || await fetchProductCost(product.id);
              const quantity = product.product_orders.quantity;
              
              totalCost += (productCost * quantity);
              totalRevenue += (product.sell_price * quantity);
            }
          }
          
          return {
            ...order,
            total_cost: totalCost,
            total_revenue: totalRevenue,
            profit: totalRevenue - totalCost
          };
        }));
        
        setOrders(enhancedOrders);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Helper function to fetch product cost if not provided
  const fetchProductCost = async (productId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/products/${productId}`);
      if (!response.ok) return 0;
      const data = await response.json();
      return data.buy_price || 0;
    } catch (err) {
      console.error('Error fetching product cost:', err);
      return 0;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    
    try {
      const response = await fetch(`http://localhost:4000/api/orders/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete order');
      
      // Refresh the orders list
      setOrders(orders.filter(order => order.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  if (loading) return <div>Loading orders...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Orders</h2>
        <Button asChild>
          <Link to="/orders/new">Create Order</Link>
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Order #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Profit</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">#{order.id}</TableCell>
                <TableCell>{formatDate(order.order_date)}</TableCell>
                <TableCell>{order.customer_name}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    order.status === 'delivered' 
                      ? 'bg-green-100 text-green-800' 
                      : order.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : order.status === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(order.total_revenue)}
                </TableCell>
                <TableCell className="text-right">
                  <span className="text-gray-600">
                    {formatCurrency(order.total_cost)}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <span className={`font-medium ${
                    order.profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(order.profit)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/orders/${order.id}`}>View</Link>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDelete(order.id)}
                      disabled={order.status === 'cancelled'}
                    >
                      {order.status === 'cancelled' ? 'Deleted' : 'Delete'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Summary row */}
      {orders.length > 0 && (
        <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Total Orders</p>
            <p className="text-xl font-semibold">{orders.length}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <p className="text-xl font-semibold">
              {formatCurrency(orders.reduce((sum, order) => sum + (order.total_revenue || 0), 0))}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Total Cost</p>
            <p className="text-xl font-semibold">
              {formatCurrency(orders.reduce((sum, order) => sum + (order.total_cost || 0), 0))}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500">Total Profit</p>
            <p className={`text-xl font-semibold ${
              orders.reduce((sum, order) => sum + (order.profit || 0), 0) >= 0 
                ? 'text-green-600' 
                : 'text-red-600'
            }`}>
              {formatCurrency(orders.reduce((sum, order) => sum + (order.profit || 0), 0))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}