'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, MapPin, Phone, Building2 } from 'lucide-react';
import { useUnifiedTranslation } from '@/hooks/use-unified-translation';
import type { FertilizerShop } from '@/server/fertilizer-shop-loader';

interface ResultsTableProps {
  shops: FertilizerShop[];
  lastUpdated: string;
  totalCount: number;
}

type SortField = 'shopName' | 'state' | 'district' | 'address';
type SortDirection = 'asc' | 'desc';

interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

const ITEMS_PER_PAGE = 25;

export function ResultsTable({ shops, lastUpdated, totalCount }: ResultsTableProps) {
  const { t } = useUnifiedTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'shopName', direction: 'asc' });

  // Sort the shops based on current sort configuration
  const sortedShops = useMemo(() => {
    const sorted = [...shops].sort((a, b) => {
      let aVal = a[sortConfig.field];
      let bVal = b[sortConfig.field];
      
      // Handle case-insensitive string comparison
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [shops, sortConfig]);

  // Calculate pagination
  const totalPages = Math.ceil(sortedShops.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentShops = sortedShops.slice(startIndex, endIndex);

  // Handle sorting
  const handleSort = (field: SortField) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset to first page when sorting
  };

  // Handle pagination
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Render sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="w-4 h-4" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4" />
      : <ArrowDown className="w-4 h-4" />;
  };

  // Format last updated date
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Empty state
  if (shops.length === 0) {
    return (
      <Alert>
        <Building2 className="h-4 w-4" />
        <AlertDescription>
          No fertilizer shops found matching your criteria. Try adjusting your filters or check back later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Results Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-sm">
            {shops.length} of {totalCount} shops
          </Badge>
          {shops.length !== totalCount && (
            <span className="text-sm text-muted-foreground">(filtered)</span>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Last updated: {formatDate(lastUpdated)}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[250px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('shopName')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      aria-label="Sort by shop name"
                    >
                      Shop Name
                      <SortIcon field="shopName" />
                    </Button>
                  </TableHead>
                  <TableHead className="min-w-[200px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('address')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      aria-label="Sort by address"
                    >
                      Address
                      <SortIcon field="address" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[150px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('district')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      aria-label="Sort by district"
                    >
                      District
                      <SortIcon field="district" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[120px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('state')}
                      className="h-auto p-0 font-semibold hover:bg-transparent"
                      aria-label="Sort by state"
                    >
                      State
                      <SortIcon field="state" />
                    </Button>
                  </TableHead>
                  <TableHead className="w-[150px]">Contact</TableHead>
                  <TableHead className="w-[120px]">License</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentShops.map((shop, index) => (
                  <TableRow key={`${shop.licenseNumber}-${index}`} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-start gap-2">
                        <Building2 className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span className="line-clamp-2">{shop.shopName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                        <span className="line-clamp-2 text-sm">{shop.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {shop.district || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {shop.state}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <a 
                          href={`tel:${shop.contact}`}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          aria-label={`Call ${shop.shopName}`}
                        >
                          {shop.contact}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-mono">
                        {shop.licenseNumber}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1}-{Math.min(endIndex, sortedShops.length)} of {sortedShops.length} shops
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              aria-label="Go to first page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(pageNum)}
                    className="w-8 h-8 p-0"
                    aria-label={`Go to page ${pageNum}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Go to last page"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
