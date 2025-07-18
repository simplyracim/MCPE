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
  const [selectedProduct, setSelectedProduct] = useState("");
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
          setLoading(true);
          console.log('Fetching order with ID:', id);
          const response = await fetch(`http://localhost:4000/api/orders/${id}`);
          if (!response.ok) throw new Error('Failed to fetch order');
          const data = await response.json();
          
          console.log('API Response:', JSON.stringify(data, null, 2));
          
          // Map the data to match our form structure
          const formItems = data.products ? data.products.map(p => {
            console.log('Processing product:', p.product_id, p.name, 'Components:', p.components);
            return {
              productId: p.product_id,  // Changed from p.id to p.product_id
              name: p.name,
              price: parseFloat(p.sell_price),
              quantity: p.quantity,  // Changed from p.product_orders.quantity
              buy_price: parseFloat(p.buy_price),
              components: p.components || []
            };
          }) : [];
          
          console.log('Form items:', formItems);
          
          setFormData({
            customer_name: data.customer_name,
            status: data.status,
            items: formItems
          });
          
          // Pre-calculate component details for existing items
          if (data.products) {
            const details = {};
            for (const p of data.products) {
              console.log('Calculating components for product:', p.product_id);
              // Create a product-like object with the correct structure
              const productWithComponents = {
                ...p,
                id: p.product_id,
                components: p.components || []
              };
              details[p.product_id] = await calculateComponents(productWithComponents, p.quantity);
              console.log('Calculated details:', p.product_id, details[p.product_id]);
            }
            setComponentDetails(details);
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchOrder();
    }
  }, [id, isEdit]);

  // Calculate costs from product tree
  const calculateComponents = (product, qty = 1, parentRate = 1) => {
    try {
      console.log('calculateComponents called with:', { 
        id: product.id, 
        name: product.name, 
        qty, 
        hasComponents: !!product.components,
        componentCount: product.components?.length || 0
      });
      
      // If product is already processed (has totalCost), return as is
      if (product.totalCost !== undefined) {
        console.log('Returning cached product:', product.id);
        return product;
      }
      
      // Ensure we have a valid product object
      if (!product) {
        console.error('Invalid product data:', product);
        return {
          id: 'unknown',
          name: 'Unknown Product',
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
            const compQty = quantity * (comp.rate || 1);
            const compCost = calculateCosts(comp, compQty, comp.rate);
            totalCost += compCost.totalCost || 0;
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
          rate: parentRate
        };
      };
      
      return calculateCosts(product, qty, parentRate);
      
    } catch (error) {
      console.error('Error calculating components:', error);
      return {
        ...product,
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

  const fetchProductWithComponents = async (productId) => {
    try {
      const response = await fetch(`http://localhost:4000/api/products/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch product details');
      return await response.json();
    } catch (error) {
      console.error('Error fetching product details:', error);
      return null;
    }
  };

  const addProduct = async () => {
    if (!selectedProduct || quantity < 1) {
      return;
    }
    
    try {
      // Convert selectedProduct to number for comparison since IDs are numbers
      const productId = Number(selectedProduct);
      const qty = Number(quantity);
      
      // Find the basic product info
      const product = products.find(p => p.id === productId);
      if (!product) {
        // Product not found
        return;
      }

      // Check if product is already in the order
      const existingItemIndex = formData.items.findIndex(item => item.productId === productId);
      
      // Fetch complete product data including components
      const fullProduct = await fetchProductWithComponents(productId);
      if (!fullProduct) {
        // Failed to load product details
        return;
      }
      
      // Calculate component details using the full product data
      const calculateComponents = (product, quantity = 1, rate = 1) => {
        let totalCost = 0;
        const components = [];
        
        if (product.components && product.components.length > 0) {
          product.components.forEach(comp => {
            const compQty = quantity * (comp.rate || 1);
            const compResult = calculateComponents(comp, compQty, comp.rate);
            totalCost += compResult.totalCost;
            components.push(compResult);
          });
        } else {
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
      
      const details = calculateComponents(fullProduct, qty);
      
      if (existingItemIndex >= 0) {
        // Update quantity if product already in order
        const updatedItems = [...formData.items];
        const newQuantity = updatedItems[existingItemIndex].quantity + qty;
        
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: newQuantity
        };
        
        // Recalculate with new quantity
        const updatedDetails = calculateComponents(fullProduct, newQuantity);
        
        setFormData(prev => ({
          ...prev,
          items: updatedItems
        }));
        
        setComponentDetails(prev => ({
          ...prev,
          [productId]: updatedDetails
        }));
      } else {
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

  const calculateCost = () => {
    const total = formData.items.reduce((sum, item) => {
      const details = componentDetails[item.productId];
      if (details && typeof details.totalCost === 'number') {
        return sum + details.totalCost;
      }
      // Fallback to buy_price if no component details available
      const itemCost = Number(item.buy_price || 0) * (item.quantity || 1);
      return sum + itemCost;
    }, 0);
    
    // Calculate total cost
    return total.toFixed(2);
  };

  const calculateProfit = () => {
    const totalRevenue = formData.items.reduce((sum, item) => {
      const itemPrice = Number(item.price || 0);
      const itemQty = Number(item.quantity || 1);
      return sum + (itemPrice * itemQty);
    }, 0);
    
    const totalCost = parseFloat(calculateCost());
    const profit = totalRevenue - totalCost;
    // Calculate profit
    return profit.toFixed(2);
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
        items: formData.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };
      
      console.log('Submitting order:', orderData);

      const url = isEdit 
        ? `http://localhost:4000/api/orders/${id}`
        : 'http://localhost:4000/api/orders';
      
      const method = isEdit ? 'PUT' : 'POST';
      
      // For new orders, we can send everything in one request
      if (!isEdit) {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(orderData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create order');
        }
        
        return navigate('/orders');
      }
      
      // For editing existing orders
      // First update the order details
      const orderResponse = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: orderData.customer_name,
          status: orderData.status
        }),
      });
      
      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.message || 'Failed to update order');
      }
      
      // Then update the products
      // First, clear existing products
      const clearResponse = await fetch(`http://localhost:4000/api/orders/${id}/products`, {
        method: 'DELETE'
      });
      
      if (!clearResponse.ok) {
        throw new Error('Failed to clear existing products from order');
      }
      
      // Then add each product
      for (const item of formData.items) {
        const addResponse = await fetch(`http://localhost:4000/api/orders/${id}/products/${item.productId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ quantity: item.quantity })
        });
        
        if (!addResponse.ok) {
          throw new Error(`Failed to add product ${item.productId} to order`);
        }
      }

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

  const renderComponentTree = (component, level = 0, parentPath = 'root') => {
    if (!component) {
      console.log(`[${parentPath}] Received null/undefined component at level ${level}`);
      return null;
    }
    
    const componentId = component.id || 'unknown';
    const componentPath = `${parentPath}.${componentId}`;
    
    // Debug log
    console.log(`[${componentPath}] Rendering component at level ${level}:`, {
      id: componentId,
      name: component.name,
      rate: component.rate,
      quantity: component.quantity,
      buy_price: component.buy_price,
      sell_price: component.sell_price,
      price: component.price,
      totalCost: component.totalCost,
      hasComponents: Array.isArray(component.components) && component.components.length > 0,
      componentLevel: level,
      componentType: typeof component
    });
    
    const displayRate = component.rate ? `${component.rate} × ` : '';
    const qty = component.quantity || 1;
    const rate = component.rate || 1;
    const displayTotal = (rate * qty).toFixed(2);
    const totalCost = component.totalCost || 0;
    const unitPrice = Number(component.buy_price || 0);
    const sellPrice = Number(component.sell_price || component.price || 0);
    
    return (
      <div key={`${component.id}-${level}`} className="ml-4 pl-4 border-l-2 border-gray-200">
        <div className="flex justify-between py-1 items-center">
          <div className="flex-1">
            <span className="font-medium">{component.name || `Product ${component.id || ''}`.trim()}</span>
            {component.description && (
              <span className="text-sm text-gray-500 ml-2">({component.description})</span>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {displayRate}{qty} = {displayTotal} units
            </div>
            <div className="text-xs text-gray-500">
              Unit Cost: ${unitPrice.toFixed(2)}
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
                  {renderComponentTree(comp, level + 1, componentPath)}
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
              Sell Price: ${(sellPrice * qty).toFixed(2)}
            </div>
            <div className="text-sm font-semibold">
              Profit: ${((sellPrice * qty) - totalCost).toFixed(2)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Get the current date in a readable format
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  
    // Calculate order totals
    const subtotal = calculateTotal();
    const totalCost = calculateCost();
    const profit = calculateProfit();
  
    // Function to convert React elements to HTML string
    const renderComponentTreeToHTML = (component, level = 0) => {
      if (!component) return '';
      
      const displayRate = component.rate ? `${component.rate} × ` : '';
      const qty = component.quantity || 1;
      const rate = component.rate || 1;
      const displayTotal = (rate * qty).toFixed(2);
      const totalCost = component.totalCost || 0;
      const unitPrice = Number(component.buy_price || 0);
      const sellPrice = Number(component.sell_price || component.price || 0);
      
      let html = `
        <div style="margin-left: ${level * 15}px; padding-left: 4px; border-left: 1px solid #e2e8f0; margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <div>
              <span style="font-weight: 500;">${component.name || `Product ${component.id || ''}`.trim()}</span>
              ${component.description ? `<span style="font-size: 12px; color: #64748b; margin-left: 4px;">(${component.description})</span>` : ''}
            </div>
            <div style="text-align: right;">
              <div style="font-size: 12px; color: #64748b;">
                ${displayRate}${qty} = ${displayTotal} units
              </div>
              <div style="font-size: 11px; color: #94a3b8;">
                Unit Cost: $${unitPrice.toFixed(2)}
              </div>
            </div>
          </div>
      `;
      
      if (component.components && component.components.length > 0) {
        html += `
          <div style="margin-top: 4px;">
            <div style="font-size: 11px; font-weight: 500; color: #64748b; margin-bottom: 2px;">Components:</div>
            ${component.components.map(comp => renderComponentTreeToHTML(comp, level + 1)).join('')}
            <div style="font-size: 11px; color: #64748b; text-align: right; margin-top: 4px;">
              Total Components Cost: $${totalCost.toFixed(2)}
            </div>
          </div>
        `;
      }
      
      if (level === 0) {
        html += `
          <div style="text-align: right; margin-top: 4px;">
            <div style="font-size: 13px; font-weight: 500;">
              Total Cost: $${totalCost.toFixed(2)}
            </div>
            <div style="font-size: 13px;">
              Sell Price: $${(sellPrice * qty).toFixed(2)}
            </div>
            <div style="font-size: 13px; font-weight: 600;">
              Profit: $${((sellPrice * qty) - totalCost).toFixed(2)}
            </div>
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
        <title>Order Invoice</title>
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
            <div class="invoice-title">Order Invoice</div>
            <div>Customer Name: ${formData.customer_name}</div>
          </div>
          <div class="invoice-meta">
            <div>Date: ${currentDate}</div>
            <div>Status: ${formData.status.toUpperCase()}</div>
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
            ${formData.items.map(item => {
              const details = componentDetails[item.productId];
              const hasComponents = details?.components?.length > 0;
              
              return `
                <tr>
                  <td>
                    <div style="font-weight: 500;">${item.name}</div>
                    ${hasComponents ? `
                      <div style="margin-top: 10px;">
                        ${renderComponentTreeToHTML({
                          ...details,
                          id: item.productId,
                          name: item.name,
                          quantity: item.quantity,
                          price: item.price,
                          sell_price: item.price,
                          buy_price: item.buy_price,
                          components: details.components || []
                        })}
                      </div>
                    ` : ''}
                  </td>
                  <td style="text-align: right;">$${item.price.toFixed(2)}</td>
                  <td style="text-align: right;">${item.quantity}</td>
                  <td style="text-align: right;">$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
  
        <div class="total-section">
          <div class="total-row">
            <span class="total-label">Subtotal:</span>
            <span>$${subtotal}</span>
          </div>
          <div class="total-row">
            <span class="total-label">Total Cost:</span>
            <span>$${totalCost}</span>
          </div>
          <div class="total-row grand-total">
            <span>Estimated Profit:</span>
            <span>$${profit}</span>
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
  
    printWindow.document.close();
  };

  return (
    <div className="max-w-5xl mx-auto print-area">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">
            {isEdit ? 'Edit Order' : 'Create New Order'}
          </h2>
          <p className="text-gray-600">
            {isEdit 
              ? 'Update order details'
              : 'Fill in the details to create a new order'}
          </p>
        </div>
        {isEdit && (
          <Button 
            type="button" 
            variant="outline" 
            className="print:hidden"
            onClick={handlePrint}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            Print Order
          </Button>
        )}
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
                    <SelectValue placeholder="Select a product">
                      {selectedProduct && products.find(p => p.id.toString() === selectedProduct)?.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => (
                      <SelectItem key={product.id} value={product.id.toString()}>
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
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.name}
                              {componentDetails[item.productId] && (
                                <div className="mt-2 text-xs text-gray-500">
                                  {renderComponentTree({
                                    ...componentDetails[item.productId],
                                    id: item.productId,
                                    name: item.name,
                                    quantity: item.quantity,
                                    price: item.price,
                                    sell_price: item.price, // Make sure sell_price is set
                                    buy_price: item.buy_price,
                                    components: componentDetails[item.productId]?.components || []
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
                    {formData.items.some(item => {
                      const hasComponents = componentDetails[item.productId]?.components?.length > 0;
                      console.log(`Item ${item.name} (${item.productId}) has components:`, 
                        hasComponents, 
                        hasComponents ? componentDetails[item.productId].components : 'none');
                      return hasComponents;
                    }) && (
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