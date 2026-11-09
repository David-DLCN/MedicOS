import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { PAGE_SIZE, getPatientList } from "@/features/patients/get-patients-data";
import { PatientCards } from "@/features/patients/patient-cards";
import { PatientFilters } from "@/features/patients/patient-filters";
import { parsePatientListParams, patientListHref } from "@/features/patients/patient-list-params";
import { PatientTable } from "@/features/patients/patient-table";
import { ACTIVE_WINDOW_DAYS } from "@/lib/domain/patients";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = { title: "Pacientes" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function PatientsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = parsePatientListParams(await searchParams);
  const data = await getPatientList(params);

  return (
    <>
      <PageHeader
        title="Pacientes"
        description={`${formatNumber(data.counts.all)} pacientes · ${formatNumber(data.counts.active)} activos en los últimos ${ACTIVE_WINDOW_DAYS} días · ${formatNumber(data.withUpcoming)} con cita próxima.`}
      />

      <div className="space-y-4">
        <PatientFilters params={params} counts={data.counts} />

        {data.total === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No encontramos pacientes"
            description={
              params.query
                ? `Ningún paciente coincide con "${params.query}". Revisa la ortografía o busca por correo o teléfono.`
                : "No hay pacientes en este grupo."
            }
          >
            <ButtonLink href="/patients" variant="secondary">
              Ver todos los pacientes
            </ButtonLink>
          </EmptyState>
        ) : (
          <Card>
            <CardContent className="pt-2">
              <div className="md:hidden">
                <PatientCards rows={data.rows} now={data.now} />
              </div>
              <div className="hidden md:block">
                <PatientTable rows={data.rows} now={data.now} />
              </div>
              <Pagination
                page={data.page}
                pageCount={data.pageCount}
                total={data.total}
                pageSize={PAGE_SIZE}
                itemLabel="pacientes"
                hrefFor={(page) => patientListHref(params, { page })}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
