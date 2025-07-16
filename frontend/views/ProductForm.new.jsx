import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Textarea } from '../components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/Table';

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 0,
    sell_price: '',
    buy_price: ''
  });
  
  const [components, setComponents] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedComponent, setSelectedComponent] = useState('');
  const [componentRate, setComponentRate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setAvailableProducts(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchProducts();

    if (isEdit) {
      const fetchProduct = async () => {
        try {
          const response = await fetch(`http://localhost:4000/api/products/${id}`);
          if (!response.ok) throw new Error('Failed to fetch product');
          const data = await response.json();
          
          setFormData({
            name: data.name || '',
            description: data.description || '',
            quantity: data.quantity || 0,
            sell_price: data.sell_price ? data.sell_price.toString() : '',
            buy_price: data.buy_price ? data.buy_price.toString() : ''
          });
          
          if (data.components && data.components.length > 0) {
            setComponents(data.components.map(comp => ({
              id: comp.id,
              name: comp.name,
              rate: comp.rate
            })));
          }
        } catch (err) {
          setError(err.message);
        }
      };
      fetchProduct();
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
  
  const handleAddComponent = async () => {
    if (!selectedComponent || !componentRate) return;
    
    try {
      const response = await fetch('http://localhost:4000/api/products/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initial_product_id: id,
          final_product_id: selectedComponent,
          rate: parseFloat(componentRate) || 1
        })
      });
      
      if (!response.ok) throw new Error('Failed to add component');
      
      const newComponent = availableProducts.find(p => p.id === parseInt(selectedComponent));
      setComponents(prev => [...prev, {
        id: selectedComponent,
        name: newComponent.name,
        rate: componentRate
      }]);
      
      setSelectedComponent('');
      setComponentRate('');
    } catch (err) {
      setError(err.message);
    }
  };
  
  const handleRemoveComponent = async (componentId) => {
    try {
      const response = await fetch('http://localhost:4000/api/products/unset', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initial_product_id: id,
          final_product_id: componentId
        })
      });
      
      if (!response.ok) throw new Error('Failed to remove component');
      
      setComponents(prev => prev.filter(c => c.id !== componentId));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const productData = {
        ...formData,
        sell_price: parseFloat(formData.sell_price) || 0,
        buy_price: parseFloat(formData.buy_price) || 0,
        quantity: parseInt(formData.quantity, 10) || 0,
      };

      const url = isEdit 
        ? `http://localhost:4000/api/products/${id}`
        : 'http://localhost:4000/api/products';
      
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Something went wrong');
      }

      if (!isEdit) {
        const result = await response.json();
        navigate(`/products/edit/${result.id}`);
      } else {
        navigate('/products');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          {isEdit ? 'Edit Product' : 'Add New Product'}
        </h2>
        <p className="text-gray-600">
          {isEdit 
            ? 'Update product information'
            : 'Fill in the details to add a new product'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sell_price">Selling Price *</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
              <Input
                id="sell_price"
                name="sell_price"
                type="text"
                value={formData.sell_price}
                onChange={handleNumberChange}
                className="pl-8"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="buy_price">Buy Price</Label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-500">$</span>
              <Input
                id="buy_price"
                name="buy_price"
                type="text"
                value={formData.buy_price}
                onChange={handleNumberChange}
                className="pl-8"
              />
            </div>
          </div>
        </div>
        
        {isEdit && (
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Product Components</h3>
            
            <div className="flex gap-2 mb-4">
              <Select value={selectedComponent} onValueChange={setSelectedComponent}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Select a component" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts
                    .filter(p => p.id !== parseInt(id))
                    .map(product => (
                      <SelectItem key={product.id} value={product.id.toString()}>
                        {product.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              
              <Input
                type="number"
                placeholder="Rate"
                min="0.01"
                step="0.01"
                value={componentRate}
                onChange={(e) => setComponentRate(e.target.value)}
                className="w-32"
              />
              
              <Button 
                type="button" 
                onClick={handleAddComponent}
                disabled={!selectedComponent || !componentRate}
              >
                Add Component
              </Button>
            </div>
            
            {components.length > 0 && (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {components.map(component => (
                      <TableRow key={component.id}>
                        <TableCell>{component.name}</TableCell>
                        <TableCell>{component.rate}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveComponent(component.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/products')}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
