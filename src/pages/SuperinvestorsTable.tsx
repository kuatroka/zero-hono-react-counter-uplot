import { useQuery, useZero } from '@rocicorp/zero/react';
import { useNavigate } from 'react-router-dom';
import { DataTable, ColumnDef } from '@/components/DataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Superinvestor, Schema } from '@/schema';

export function SuperinvestorsTablePage() {
  const z = useZero<Schema>();
  const navigate = useNavigate();
  const [superinvestors] = useQuery(z.query.superinvestors.orderBy('cikName', 'asc'));

  const columns: ColumnDef<Superinvestor>[] = [
    {
      key: 'cik',
      header: 'CIK',
      sortable: true,
      searchable: true,
      clickable: true,
      render: (value, row, isFocused) => (
        <a
          href={`/superinvestors/${row.cik}`}
          onClick={(e) => {
            e.preventDefault();
            navigate(`/superinvestors/${encodeURIComponent(row.cik)}`);
          }}
          className={`hover:underline underline-offset-4 cursor-pointer text-foreground outline-none ${isFocused ? 'underline' : ''}`}
        >
          {String(value)}
        </a>
      ),
    },
    {
      key: 'cikName',
      header: 'Name',
      sortable: true,
      searchable: true,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Superinvestors</CardTitle>
          <CardDescription>Browse and search institutional investors (13F filers)</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            data={superinvestors || []}
            columns={columns}
            searchPlaceholder="Search superinvestors..."
            defaultPageSize={10}
            defaultSortColumn="cikName"
            defaultSortDirection="asc"
          />
        </CardContent>
      </Card>
    </div>
  );
}
