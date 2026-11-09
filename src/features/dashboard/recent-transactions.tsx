import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, Td, Th } from "@/components/ui/table";
import { PAYMENT_METHOD_LABEL, PAYMENT_STATUS } from "@/features/finance/labels";
import type { Transaction } from "@/lib/domain/types";
import { formatDate, formatMoney } from "@/lib/format";

export interface TransactionRow {
  transaction: Transaction;
  patientName: string;
  consultationName: string;
}

export function RecentTransactions({ rows }: { rows: TransactionRow[] }) {
  return (
    <Card>
      <CardHeader
        title="Movimientos recientes"
        description="Últimos cobros y reembolsos."
        action={
          <ButtonLink href="/finance" variant="ghost" size="sm">
            Ver finanzas
          </ButtonLink>
        }
      />
      <CardContent className="pt-2">
        <Table>
          <thead>
            <tr>
              <Th>Paciente</Th>
              <Th>Fecha</Th>
              <Th>Método</Th>
              <Th>Estado</Th>
              <Th className="text-right">Importe</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ transaction, patientName, consultationName }) => {
              const status = PAYMENT_STATUS[transaction.status];
              return (
                <tr key={transaction.id}>
                  <Td>
                    <p className="font-medium">{patientName}</p>
                    <p className="text-xs text-muted">{consultationName}</p>
                  </Td>
                  <Td className="tabular text-muted">{formatDate(transaction.createdAt, "short")}</Td>
                  <Td className="text-muted">{PAYMENT_METHOD_LABEL[transaction.method]}</Td>
                  <Td>
                    <Badge tone={status.tone}>{status.label}</Badge>
                  </Td>
                  <Td
                    className={`tabular text-right font-medium ${transaction.status === "refunded" ? "text-muted line-through" : ""}`}
                  >
                    {formatMoney(transaction.amount)}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </CardContent>
    </Card>
  );
}
