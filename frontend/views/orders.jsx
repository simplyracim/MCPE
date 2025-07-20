import { useState, useEffect } from 'react';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Printer } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Function to calculate costs including components
  const calculateProductCost = (product, quantity = 1) => {
    if (!product) return { totalCost: 0, totalRevenue: 0 };

    let totalCost = 0;
    const sellPrice = parseFloat(product.sell_price) || 0;
    const totalRevenue = sellPrice * quantity;

    // If product has components, calculate their costs
    if (product.components?.length > 0) {
      product.components.forEach(component => {
        const compQty = quantity * (parseFloat(component.rate) || 1);
        const { totalCost: compCost } = calculateProductCost(component, compQty);
        totalCost += compCost;
      });
    } else {
      // Base component - use buy price
      totalCost = (parseFloat(product.buy_price) || 0) * quantity;
    }

    return { totalCost, totalRevenue };
  };

  const fetchOrderWithProducts = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/orders/${orderId}?_embed=products`);
      if (!response.ok) {
        throw new Error(`Failed to fetch order ${orderId}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching order ${orderId}:`, error);
      return null;
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/orders');
        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.status} ${response.statusText}`);
        }
        const orders = await response.json();

        const ordersWithProducts = await Promise.all(
          orders.map(order => fetchOrderWithProducts(order.id))
        );
        const validOrders = ordersWithProducts.filter(Boolean);

        const enhancedOrders = await Promise.all(validOrders.map(async order => {
          let totalCost = 0;
          let totalRevenue = 0;

          if (order.products && order.products.length > 0) {
            const productsWithDetails = await Promise.all(
              order.products.map(async (product) => {
                try {
                  const response = await fetch(`http://localhost:4000/api/products/${product.product_id || product.id}`);
                  return response.ok ? await response.json() : product;
                } catch (error) {
                  return product;
                }
              })
            );

            for (let i = 0; i < order.products.length; i++) {
              const product = productsWithDetails[i];
              const quantity = order.products[i].product_orders?.quantity || 1;
              const { totalCost: cost, totalRevenue: revenue } = calculateProductCost(product, quantity);
              totalCost += cost;
              totalRevenue += revenue;
            }
          }

          return {
            ...order,
            total_cost: totalCost,
            total_revenue: totalRevenue,
            profit: totalRevenue - totalCost
          };
        }));

        const sortedOrders = [...enhancedOrders].sort((a, b) => new Date(b.order_date) - new Date(a.order_date));

        setOrders(sortedOrders);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;

    try {
      const response = await fetch(`http://localhost:4000/api/orders/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete order');

      setOrders(orders.filter(order => order.id !== id));
    } catch (err) {
      setError(err.message);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handlePrint = async (order) => {
    try {
      const orderDetails = await fetch(`http://localhost:4000/api/orders/${order.id}`);
      if (!orderDetails.ok) throw new Error('Failed to fetch order details');

      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order Invoice #${order.id}</title>
          <style>
            /* styles */
          </style>
        </head>
        <body>
          <!-- content -->
        </body>
        </html>
      `);

      printWindow.close();
    } catch (error) {
      console.error('Print error:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <Link to="/orders/new">
          <Button>Create Order</Button>
        </Link>
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
                      variant="outline" 
                      size="sm" 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePrint(order);
                      }}
                      title="Print Order"
                    >
                      <Printer className="h-4 w-4" />
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