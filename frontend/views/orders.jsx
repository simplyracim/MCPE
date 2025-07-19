import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';
import { Printer } from 'lucide-react';

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

  const fetchOrderDetails = async (orderId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/orders/${orderId}`);
      if (!response.ok) throw new Error('Failed to fetch order details');
      return await response.json();
    } catch (error) {
      console.error('Error fetching order details:', error);
      throw error;
    }
  };

  const handlePrint = async (order) => {
    try {
      // Show loading state in the main window
      const originalButtonText = event.target.innerHTML;
      event.target.disabled = true;
      event.target.innerHTML = 'Loading...';
      
      // Fetch complete order details before opening the print window
      const orderDetails = await fetchOrderDetails(order.id);
      
      // Get the current date in a readable format
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    
      // Calculate order totals
      const subtotal = orderDetails.total_revenue || 0;
      const totalCost = orderDetails.total_cost || 0;
      const profit = orderDetails.profit || 0;
      
      // Only open the print window after we have the data
      const printWindow = window.open('', '_blank');
  
    // Function to convert React elements to HTML string
    const renderComponentTreeToHTML = (component, level = 0) => {
      if (!component) return '';
      
      const qty = Number(component.quantity) || 1;
      const price = Number(component.sell_price) || 0;
      const total = (price * qty).toFixed(2);
      
      let html = `
        <div style="margin-left: ${level * 15}px; padding-left: 4px; border-left: 1px solid #e2e8f0; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <div>
              <span style="font-weight: 500;">${component.name || `Product ${component.id || ''}`.trim()}</span>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; color: #64748b;">
                ${qty} × $${price ? price.toFixed(2) : '0.00'} = $${total}
              </div>
            </div>
          </div>
      `;
      
      if (component.components && component.components.length > 0) {
        html += `
          <div style="margin-top: 4px;">
            <div style="font-size: 11px; font-weight: 500; color: #64748b; margin-bottom: 2px;">Components:</div>
            ${component.components.map(comp => renderComponentTreeToHTML(comp, level + 1)).join('')}
          </div>
        `;
      }
      
      html += `</div>`;
      return html;
    };
  
    // Generate the HTML content for printing
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Invoice #${order.id}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm;
          }
          .invoice-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            border-bottom: 2px solid #eee;
            padding-bottom: 20px;
          }
          .invoice-title {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
          }
          .invoice-meta {
            text-align: right;
            font-size: 14px;
            color: #7f8c8d;
          }
          .customer-info {
            margin-bottom: 30px;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 5px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            margin: 25px 0 15px 0;
            color: #2c3e50;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          .items-table th {
            background: #f8f9fa;
            text-align: left;
            padding: 12px 15px;
            font-weight: 600;
            font-size: 14px;
            color: #495057;
            border-bottom: 2px solid #dee2e6;
          }
          .items-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #dee2e6;
            vertical-align: top;
          }
          .items-table tr:last-child td {
            border-bottom: none;
          }
          .total-section {
            margin-top: 30px;
            margin-left: auto;
            width: 300px;
            border-top: 2px solid #eee;
            padding-top: 15px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .total-label {
            font-weight: 600;
          }
          .grand-total {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #eee;
          }
          .signature-section {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
          }
          .signature-line {
            width: 250px;
            border-top: 1px solid #333;
            margin-top: 50px;
            text-align: center;
            padding-top: 5px;
            font-size: 14px;
          }
          .footer {
            margin-top: 40px;
            font-size: 12px;
            color: #7f8c8d;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="invoice-header">
          <div>
            <div class="invoice-title">Order Invoice #${orderDetails.id}</div>
            <div>Customer: ${orderDetails.customer_name || 'N/A'}</div>
          </div>
          <div class="invoice-meta">
            <div>Date: ${formatDate(orderDetails.order_date)}</div>
            <div>Status: ${orderDetails.status.toUpperCase()}</div>
          </div>
        </div>
  
        <div class="section-title">Order Items</div>
        <table class="items-table">
          <thead>
            <tr>
              <th>Product</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: right;">Qty</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${orderDetails.products?.map(item => {
              const quantity = Number(item.product_orders?.quantity) || 1;
              const price = Number(item.sell_price) || 0;
              const total = (price * quantity).toFixed(2);
              
              return `
                <tr>
                  <td>
                    <div style="font-weight: 500;">${item.name || `Product ${item.id}`}</div>
                    ${item.components?.length > 0 ? `
                      <div style="margin-top: 10px;">
                        <div style="font-size: 11px; font-weight: 500; color: #64748b; margin-bottom: 2px;">Components:</div>
                        ${item.components.map(comp => renderComponentTreeToHTML(comp, 1)).join('')}
                      </div>
                    ` : ''}
                  </td>
                  <td style="text-align: right;">$${price ? price.toFixed(2) : '0.00'}</td>
                  <td style="text-align: right;">${quantity}</td>
                  <td style="text-align: right;">$${total || '0.00'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
  
        <div class="total-section">
          <div class="total-row">
            <span class="total-label">Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
          </div>
          <div class="total-row">
            <span class="total-label">Total Cost:</span>
            <span>$${totalCost.toFixed(2)}</span>
          </div>
          <div class="total-row grand-total">
            <span>Profit:</span>
            <span>$${profit.toFixed(2)}</span>
          </div>
        </div>
  
        <div class="signature-section">
          <div>
            <div style="font-weight: bold; margin-bottom: 5px; text-align: center">Signature</div>
            <div class="signature-line">Company Representative</div>
          </div>
        </div>
  
        <div class="footer">
          Thank you for your business! For any questions regarding this order, please contact us.
        </div>
  
        <script>
          // Remove browser header/footer from print
          document.addEventListener('DOMContentLoaded', function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }, 200);
          });
        </script>
      </body>
      </html>
    `);
  
    } catch (error) {
      // Show error in the main window
      alert(`Failed to load order details: ${error.message}`);
      console.error('Print error:', error);
    } finally {
      // Restore button state
      if (event && event.target) {
        event.target.disabled = false;
        event.target.innerHTML = originalButtonText;
      }
      
      // Close the print window if it was opened
      if (printWindow) {
        printWindow.close();
      }
    }
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