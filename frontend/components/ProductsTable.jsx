import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { formatCurrency } from '../lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/Table';
import { Skeleton } from './ui/Skeleton';
import { ChevronDown, ChevronRight } from 'lucide-react';

function ProductRow({ product, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [components, setComponents] = useState([]);
  const [isLoadingComponents, setIsLoadingComponents] = useState(false);
  const [error, setError] = useState(null);

  const toggleExpand = async () => {
    if (!isExpanded && (!components || components.length === 0)) {
      try {
        setIsLoadingComponents(true);
        const response = await fetch(`http://localhost:4000/api/products/${product.id}`);
        if (!response.ok) throw new Error('Failed to load components');
        const data = await response.json();
        setComponents(data.components || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoadingComponents(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <TableRow className="hover:bg-gray-50 transition-colors duration-150">
        <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          <button 
            onClick={toggleExpand}
            className="flex items-center focus:outline-none"
            aria-label={isExpanded ? 'Collapse components' : 'Expand components'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 mr-1" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-1" />
            )}
            {product.id}
          </button>
        </TableCell>
        <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
          {product.name}
        </TableCell>
        <TableCell className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
          {product.description}
        </TableCell>
        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right">
          <span className="font-medium text-gray-900">
            {formatCurrency(product.sell_price || 0)}
          </span>
        </TableCell>
        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-right">
          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold leading-4 ${
            product.quantity > 10 
              ? 'bg-green-100 text-green-800' 
              : product.quantity > 0 
                ? 'bg-yellow-100 text-yellow-800' 
                : 'bg-red-100 text-red-800'
          }`}>
            {product.quantity ?? 0} in stock
          </span>
        </TableCell>
        <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-center">
          <div className="flex justify-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="hover:bg-gray-100 transition-colors"
            >
              <Link to={`/products/${product.id}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit
              </Link>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(product.id)}
              className="hover:bg-red-700 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {isExpanded && (
        <TableRow className="bg-gray-50">
          <TableCell colSpan={6} className="px-6 py-4">
            {isLoadingComponents ? (
              <div className="text-center py-4">Loading components...</div>
            ) : error ? (
              <div className="text-red-600 text-sm">Error loading components: {error}</div>
            ) : components.length > 0 ? (
              <div className="ml-8">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Components:</h4>
                <ul className="space-y-1">
                  {components.map((component, index) => (
                    <li key={index} className="text-sm text-gray-600">
                      • {component.name} (Rate: {component.rate || 1})
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-sm text-gray-500">No components added yet.</div>
            )}
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function ProductTable({ products, onDelete, isLoading = false }) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 text-gray-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
        <p className="text-sm text-gray-500">Add a new product to get started</p>
        <div className="mt-6">
          <Button asChild>
            <Link to="/products/new">Add Product</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <Table className="min-w-full divide-y divide-gray-200">
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </TableHead>
              <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </TableHead>
              <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </TableHead>
              <TableHead className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <ProductRow 
                key={product.id} 
                product={product} 
                onDelete={onDelete} 
              />
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{products.length}</span> products
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm" disabled>
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}