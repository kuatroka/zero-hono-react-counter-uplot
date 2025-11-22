import { useQuery, useZero } from '@rocicorp/zero/react';
import { useNavigate } from 'react-router-dom';
import { DataTable, ColumnDef } from '@/components/DataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Asset, Schema } from '@/schema';

export function AssetsTablePage() {
  const z = useZero<Schema>();
  const navigate = useNavigate();
  const [assets] = useQuery(z.query.assets.orderBy('assetName', 'asc'));

  const columns: ColumnDef<Asset>[] = [
    {
      key: 'asset',
      header: 'Asset',
      sortable: true,
      searchable: true,
      clickable: true,
      render: (value, row, isFocused) => (
        <a
          href={`/assets/${row.asset}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/assets/${encodeURIComponent(row.asset)}`);
          }}
          className={`hover:underline underline-offset-4 cursor-pointer text-foreground outline-none ${isFocused ? 'underline' : ''}`}
        >
          {String(value)}
        </a>
      ),
    },
    {
      key: 'assetName',
      header: 'Asset Name',
      sortable: true,
      searchable: true,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Assets</CardTitle>
          <CardDescription>Browse and search all assets</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={assets || []}
            columns={columns}
            searchPlaceholder="Search assets..."
            defaultPageSize={10}
            defaultSortColumn="assetName"
            defaultSortDirection="asc"
          />
        </CardContent>
      </Card>
    </div>
  );
}
