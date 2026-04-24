import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Barcode as BarcodeIcon,
  ChevronDown,
  Filter,
  MoreHorizontal,
  PlusCircle,
  Search,
  Tags,
  ToggleRight,
} from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Barcode } from "@/components/lims/Barcode";
import { Modal } from "@/components/lims/Modal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { formatINR, labTests, testPackages, type LabTest, type TestPackage } from "@/data/lims";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lims/tests/")({
  head: () => ({
    meta: [
      { title: "Tests / Packages - LIMS" },
      { name: "description", content: "Manage lab tests, parameters and curated test packages." },
    ],
  }),
  component: TestsConfigPage,
});

type Mode = "tests" | "packages";
type StatusFilter = "all" | "enabled" | "disabled";

const pageSize = 9;

function TestsConfigPage() {
  const [mode, setMode] = useState<Mode>("tests");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [tests, setTests] = useState<LabTest[]>(labTests);
  const [packages, setPackages] = useState<TestPackage[]>(testPackages);
  const [barcodeFor, setBarcodeFor] = useState<string | null>(null);
  const [priceEditor, setPriceEditor] = useState<LabTest | null>(null);
  const [detailsEditor, setDetailsEditor] = useState<DetailsEditorState | null>(null);

  const departments = uniqueValues(tests.map((test) => test.department));
  const categories = uniqueValues(tests.map((test) => test.category));
  const activeFilters =
    statusFilter !== "all" || departmentFilter !== "all" || categoryFilter !== "all";

  const filteredTests = tests.filter((test) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      test.name.toLowerCase().includes(normalizedQuery) ||
      test.code.toLowerCase().includes(normalizedQuery) ||
      test.department.toLowerCase().includes(normalizedQuery) ||
      test.category.toLowerCase().includes(normalizedQuery);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "enabled" && test.enabled) ||
      (statusFilter === "disabled" && !test.enabled);
    const matchesDepartment = departmentFilter === "all" || test.department === departmentFilter;
    const matchesCategory = categoryFilter === "all" || test.category === categoryFilter;

    return matchesQuery && matchesStatus && matchesDepartment && matchesCategory;
  });

  const filteredPackages = packages.filter((testPackage) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      testPackage.name.toLowerCase().includes(normalizedQuery) ||
      testPackage.code.toLowerCase().includes(normalizedQuery) ||
      testPackage.description.toLowerCase().includes(normalizedQuery);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "enabled" && testPackage.enabled) ||
      (statusFilter === "disabled" && !testPackage.enabled);

    return matchesQuery && matchesStatus;
  });

  const activeItems = mode === "tests" ? filteredTests : filteredPackages;
  const totalPages = Math.max(1, Math.ceil(activeItems.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const visibleTests = filteredTests.slice(pageStart, pageStart + pageSize);
  const visiblePackages = filteredPackages.slice(pageStart, pageStart + pageSize);

  const resetFilters = () => {
    setStatusFilter("all");
    setDepartmentFilter("all");
    setCategoryFilter("all");
    setPage(1);
  };

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const updateMode = (value: Mode) => {
    setMode(value);
    setPage(1);
    if (value === "packages") {
      setDepartmentFilter("all");
      setCategoryFilter("all");
    }
  };

  const updateTest = (id: string, patch: Partial<LabTest>) => {
    setTests((items) => items.map((test) => (test.id === id ? { ...test, ...patch } : test)));
  };

  const updatePackage = (id: string, patch: Partial<TestPackage>) => {
    setPackages((items) =>
      items.map((testPackage) =>
        testPackage.id === id ? { ...testPackage, ...patch } : testPackage,
      ),
    );
  };

  return (
    <div className="pb-4">
      <PageHeader title="Tests / Packages" backTo="/lims" />

      <section className="mx-3 overflow-visible rounded-[9px] border border-[#dfe3e8] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] md:mx-0">
        <div className="flex flex-col gap-3 px-3 py-4 sm:gap-4 sm:px-6 sm:py-[27px] lg:flex-row lg:items-center lg:justify-between lg:px-[28px]">
          <label className="flex h-10 w-full items-center gap-2 rounded-[9px] border border-[#d4d6e0] bg-[#f7f7f8] px-3 text-[#1a1c1e] shadow-[0_1px_2px_rgba(228,229,231,0.24)] sm:h-[46px] sm:rounded-[11px] sm:px-[15px] lg:max-w-[446px]">
            <Search className="h-4 w-4 opacity-50 sm:h-[20px] sm:w-[20px]" />
            <input
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Search"
              className="min-w-0 flex-1 bg-transparent text-[13px] font-normal tracking-[-0.01em] text-foreground outline-none placeholder:text-[#1a1c1e]/50 sm:text-[15px]"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2 sm:gap-[10px]">
            <ModeDropdown mode={mode} onModeChange={updateMode} />
            <FilterDropdown
              mode={mode}
              statusFilter={statusFilter}
              departmentFilter={departmentFilter}
              categoryFilter={categoryFilter}
              departments={departments}
              categories={categories}
              active={activeFilters}
              onStatusChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
              onDepartmentChange={(value) => {
                setDepartmentFilter(value);
                setPage(1);
              }}
              onCategoryChange={(value) => {
                setCategoryFilter(value);
                setPage(1);
              }}
              onReset={resetFilters}
            />
            <CreateDropdown />
          </div>
        </div>

        <div className="overflow-x-auto overflow-y-visible">
          {mode === "tests" ? (
            <TestsTable
              tests={visibleTests}
              onBarcode={setBarcodeFor}
              onEditDetails={(test) => setDetailsEditor({ type: "test", item: test })}
              onEditPrice={setPriceEditor}
              onToggleStatus={(test) => updateTest(test.id, { enabled: !test.enabled })}
            />
          ) : (
            <PackagesTable
              packages={visiblePackages}
              onEditDetails={(testPackage) =>
                setDetailsEditor({ type: "package", item: testPackage })
              }
              onToggleStatus={(testPackage) =>
                updatePackage(testPackage.id, { enabled: !testPackage.enabled })
              }
            />
          )}
        </div>

        <PaginationFooter
          page={safePage}
          totalPages={totalPages}
          total={activeItems.length}
          pageSize={pageSize}
          itemLabel={mode === "tests" ? "tests" : "packages"}
          onPageChange={setPage}
        />
      </section>

      <BarcodeModal barcodeFor={barcodeFor} onClose={() => setBarcodeFor(null)} />
      <PriceModal
        test={priceEditor}
        onClose={() => setPriceEditor(null)}
        onSave={(test, price) => {
          updateTest(test.id, { price });
          setPriceEditor(null);
        }}
      />
      <DetailsModal
        editor={detailsEditor}
        onClose={() => setDetailsEditor(null)}
        onSave={(editor) => {
          if (editor.type === "test") {
            updateTest(editor.item.id, editor.item);
          } else {
            updatePackage(editor.item.id, editor.item);
          }
          setDetailsEditor(null);
        }}
      />
    </div>
  );
}

function ModeDropdown({ mode, onModeChange }: { mode: Mode; onModeChange: (mode: Mode) => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-9 min-w-[120px] justify-between rounded-[5px] border-[#dae0e6] bg-white px-3 text-[12px] font-bold text-[#0f1720] shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:bg-white sm:h-[45px] sm:min-w-[158px] sm:px-[14px] sm:text-[13px]"
        >
          {mode === "tests" ? "Tests" : "Test Packages"}
          <ChevronDown className="h-4 w-4 text-[#667085] sm:h-[18px] sm:w-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[180px] rounded-[5px] border-[#dae0e6] p-2 shadow-[0_8px_24px_rgba(16,24,40,0.12)]"
      >
        <DropdownMenuItem className="font-semibold" onSelect={() => onModeChange("tests")}>
          Tests
        </DropdownMenuItem>
        <DropdownMenuItem className="font-semibold" onSelect={() => onModeChange("packages")}>
          Test Packages
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FilterDropdown({
  mode,
  statusFilter,
  departmentFilter,
  categoryFilter,
  departments,
  categories,
  active,
  onStatusChange,
  onDepartmentChange,
  onCategoryChange,
  onReset,
}: {
  mode: Mode;
  statusFilter: StatusFilter;
  departmentFilter: string;
  categoryFilter: string;
  departments: string[];
  categories: string[];
  active: boolean;
  onStatusChange: (value: StatusFilter) => void;
  onDepartmentChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onReset: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-9 rounded-[5px] border-[#dae0e6] bg-white px-3 text-[12px] font-bold text-[#025d54] shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:bg-[#f5fbf9] hover:text-[#025d54] sm:h-[45px] sm:px-[19px] sm:text-[13px]",
            active && "bg-[#f5fbf9] ring-1 ring-[#025d54]/20",
          )}
        >
          <Filter className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
          Filter
          {active && <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-[#025d54]" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[250px] rounded-[5px] border-[#dae0e6] p-2 shadow-[0_8px_24px_rgba(16,24,40,0.16)]"
      >
        <DropdownMenuLabel>Status</DropdownMenuLabel>
        {(["all", "enabled", "disabled"] as const).map((value) => (
          <DropdownMenuCheckboxItem
            key={value}
            checked={statusFilter === value}
            onCheckedChange={() => onStatusChange(value)}
            onSelect={(event) => event.preventDefault()}
          >
            {value === "all" ? "All" : value === "enabled" ? "Enabled" : "Disabled"}
          </DropdownMenuCheckboxItem>
        ))}
        {mode === "tests" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Department</DropdownMenuLabel>
            {["all", ...departments].map((department) => (
              <DropdownMenuCheckboxItem
                key={department}
                checked={departmentFilter === department}
                onCheckedChange={() => onDepartmentChange(department)}
                onSelect={(event) => event.preventDefault()}
              >
                {department === "all" ? "All departments" : department}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Category</DropdownMenuLabel>
            {["all", ...categories].map((category) => (
              <DropdownMenuCheckboxItem
                key={category}
                checked={categoryFilter === category}
                onCheckedChange={() => onCategoryChange(category)}
                onSelect={(event) => event.preventDefault()}
              >
                {category === "all" ? "All categories" : category}
              </DropdownMenuCheckboxItem>
            ))}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="font-semibold text-[#025d54]" onSelect={onReset}>
          Clear filters
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CreateDropdown() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-9 min-w-[122px] justify-between rounded-[5px] bg-[#025d54] px-3 text-[12px] font-bold text-white shadow-none hover:bg-[#014d46] sm:h-[45px] sm:min-w-[156px] sm:px-[18px] sm:text-[14px]">
          <span className="inline-flex items-center gap-2">
            <PlusCircle className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
            Create
          </span>
          <ChevronDown className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[190px] rounded-[5px] border-[#dae0e6] p-2 shadow-[0_8px_24px_rgba(16,24,40,0.16)]"
      >
        <DropdownMenuItem asChild className="gap-2 py-2 font-bold text-[#025d54]">
          <Link to="/lims/tests/new">
            <PlusCircle className="h-[18px] w-[18px]" />
            Create Test
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2 py-2 font-bold text-[#025d54]">
          <Link to="/lims/tests/packages/new">
            <PlusCircle className="h-[18px] w-[18px]" />
            Create Test Package
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TestsTable({
  tests,
  onBarcode,
  onEditDetails,
  onEditPrice,
  onToggleStatus,
}: {
  tests: LabTest[];
  onBarcode: (code: string) => void;
  onEditDetails: (test: LabTest) => void;
  onEditPrice: (test: LabTest) => void;
  onToggleStatus: (test: LabTest) => void;
}) {
  return (
    <table className="min-w-[1060px] w-full table-fixed border-collapse">
      <thead>
        <tr className="h-[51px] border-y border-[#eaebf0] bg-[#f6f7f8] text-left text-[12px] font-semibold uppercase tracking-[-0.01em] text-[#6f7a89]">
          <th className="w-[9%] px-[28px]">Code</th>
          <th className="w-[25%] px-[28px]">Test Name</th>
          <th className="w-[14%] px-[28px]">Department</th>
          <th className="w-[14%] px-[28px]">Category</th>
          <th className="w-[10%] px-[28px]">Specimen</th>
          <th className="w-[10%] px-[28px]">Status</th>
          <th className="w-[18%] px-[28px]">Actions</th>
        </tr>
      </thead>
      <tbody>
        {tests.map((test) => (
          <tr
            key={test.id}
            className="h-[74px] border-b border-[#eaebf0] text-[14px] text-[#111827]"
          >
            <td className="px-[28px] font-medium whitespace-nowrap">{test.code}</td>
            <td className="px-[28px]">
              <div className="font-bold">{test.name}</div>
              <div className="mt-1 text-[11px] font-semibold text-[#6f7a89]">
                {formatINR(test.price)}
              </div>
            </td>
            <td className="px-[28px]">
              <TagPill>{test.department}</TagPill>
            </td>
            <td className="px-[28px]">
              <TagPill>{test.category}</TagPill>
            </td>
            <td className="px-[28px] font-medium">{test.specimen}</td>
            <td className="px-[28px]">
              <StatusChip enabled={test.enabled} />
            </td>
            <td className="px-[28px]">
              <RowActions
                enabled={test.enabled}
                label={test.code}
                onBarcode={() => onBarcode(`TEST ${test.shortName ?? test.code} 001`)}
                onEditDetails={() => onEditDetails(test)}
                onEditPrice={() => onEditPrice(test)}
                onToggleStatus={() => onToggleStatus(test)}
              />
            </td>
          </tr>
        ))}
        {tests.length === 0 && <EmptyTableRow colSpan={7} />}
      </tbody>
    </table>
  );
}

function PackagesTable({
  packages,
  onEditDetails,
  onToggleStatus,
}: {
  packages: TestPackage[];
  onEditDetails: (testPackage: TestPackage) => void;
  onToggleStatus: (testPackage: TestPackage) => void;
}) {
  return (
    <table className="min-w-[900px] w-full table-fixed border-collapse">
      <thead>
        <tr className="h-[51px] border-y border-[#eaebf0] bg-[#f6f7f8] text-left text-[12px] font-semibold uppercase tracking-[-0.01em] text-[#6f7a89]">
          <th className="w-[14%] px-[28px]">Code</th>
          <th className="w-[44%] px-[28px]">Package Name</th>
          <th className="w-[16%] px-[28px]">Test Count</th>
          <th className="w-[12%] px-[28px]">Status</th>
          <th className="w-[14%] px-[28px]">Actions</th>
        </tr>
      </thead>
      <tbody>
        {packages.map((testPackage) => (
          <tr
            key={testPackage.id}
            className="h-[74px] border-b border-[#eaebf0] text-[14px] text-[#111827]"
          >
            <td className="px-[28px] font-medium">{testPackage.code}</td>
            <td className="px-[28px]">
              <div className="font-bold">{testPackage.name}</div>
              <div className="mt-1 line-clamp-1 text-xs font-medium text-[#6f7a89]">
                {testPackage.description}
              </div>
            </td>
            <td className="px-[28px] font-bold text-[#025d54]">{testPackage.testCount}</td>
            <td className="px-[28px]">
              <StatusChip enabled={testPackage.enabled} />
            </td>
            <td className="px-[28px]">
              <RowActions
                enabled={testPackage.enabled}
                label={testPackage.code}
                showBarcode={false}
                showPrice={false}
                onEditDetails={() => onEditDetails(testPackage)}
                onToggleStatus={() => onToggleStatus(testPackage)}
              />
            </td>
          </tr>
        ))}
        {packages.length === 0 && <EmptyTableRow colSpan={5} />}
      </tbody>
    </table>
  );
}

function RowActions({
  enabled,
  label,
  showBarcode = true,
  showPrice = true,
  onBarcode,
  onEditDetails,
  onEditPrice,
  onToggleStatus,
}: {
  enabled: boolean;
  label: string;
  showBarcode?: boolean;
  showPrice?: boolean;
  onBarcode?: () => void;
  onEditDetails: () => void;
  onEditPrice?: () => void;
  onToggleStatus: () => void;
}) {
  return (
    <div className="flex items-center gap-[10px]">
      <Button
        variant="outline"
        className="h-[40px] rounded-[5px] border-[#dae0e6] px-[14px] text-[12px] font-bold text-[#025d54] shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:bg-[#f5fbf9] hover:text-[#025d54]"
        onClick={onEditDetails}
      >
        Edit Details
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="h-[40px] w-[40px] min-w-[40px] rounded-[5px] border-[#dae0e6] text-[#475467] shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
            aria-label={`Open actions for ${label}`}
          >
            <MoreHorizontal className="h-[19px] w-[19px]" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-[211px] rounded-[5px] border-[#dae0e6] p-[10px] shadow-[0_8px_24px_rgba(16,24,40,0.18)]"
        >
          {showBarcode && (
            <DropdownMenuItem
              className="gap-3 py-2 text-[14px] font-bold text-[#2d2d2d]"
              onSelect={onBarcode}
            >
              <BarcodeIcon className="h-[20px] w-[20px] text-[#025d54]" />
              Barcode
            </DropdownMenuItem>
          )}
          {showPrice && (
            <DropdownMenuItem
              className="gap-3 py-2 text-[14px] font-bold text-[#2d2d2d]"
              onSelect={onEditPrice}
            >
              <Tags className="h-[20px] w-[20px] text-[#025d54]" />
              Edit Price
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            className="gap-3 py-2 text-[14px] font-bold text-[#2d2d2d]"
            onSelect={(event) => event.preventDefault()}
          >
            <ToggleRight className="h-[20px] w-[20px] text-[#025d54]" />
            Status
            <Switch
              checked={enabled}
              onCheckedChange={onToggleStatus}
              className="ml-auto h-[25px] w-[43px] data-[state=checked]:bg-[#025d54] [&>span]:h-[19px] [&>span]:w-[19px] [&>span]:data-[state=checked]:translate-x-[18px]"
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function EmptyTableRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-6 py-12 text-center text-sm font-medium text-[#6f7a89]">
        No records match the current search or filters.
      </td>
    </tr>
  );
}

function TagPill({ children }: { children: string }) {
  return (
    <span className="inline-flex max-w-full rounded-[3px] bg-[#eef0f2] px-[8px] py-[4px] text-[11px] font-medium leading-none text-[#6f7a89]">
      <span className="truncate">{children}</span>
    </span>
  );
}

function StatusChip({ enabled }: { enabled: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[3px] px-[7px] py-[4px] text-[11px] font-semibold leading-none",
        enabled ? "bg-[#cffbdc] text-[#00a83b]" : "bg-[#ffd6d6] text-[#ef3333]",
      )}
    >
      <span
        className={cn("h-[7px] w-[7px] rounded-full", enabled ? "bg-[#2ee866]" : "bg-[#ef3333]")}
      />
      {enabled ? "Enabled" : "Disabled"}
    </span>
  );
}

function PaginationFooter({
  page,
  totalPages,
  total,
  pageSize,
  itemLabel,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  itemLabel: string;
  onPageChange: (page: number) => void;
}) {
  const pageNumbers = buildPagination(page, totalPages);
  const shown = total === 0 ? 0 : Math.min(page * pageSize, total);

  return (
    <footer className="flex min-h-[58px] flex-col gap-2 px-3 py-3 text-[12px] font-medium tracking-[-0.01em] text-[#5f6d7e] sm:min-h-[74px] sm:flex-row sm:items-center sm:justify-between sm:px-[28px] sm:py-[14px] sm:text-[16px]">
      <p>
        Showing {shown} of {total} {itemLabel}
      </p>
      <nav className="flex flex-wrap items-center gap-0.5 sm:gap-1" aria-label="Pagination">
        <button
          className="inline-flex h-8 items-center gap-1 px-1.5 hover:text-[#025d54] disabled:cursor-not-allowed disabled:opacity-40 sm:h-[46px] sm:gap-2 sm:px-2"
          disabled={page === 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          <ArrowLeft className="h-3.5 w-3.5 sm:h-[18px] sm:w-[18px]" />
          Prev
        </button>
        {pageNumbers.map((pageNumber, index) =>
          pageNumber === "..." ? (
            <span
              key={`ellipsis-${index}`}
              className="flex h-8 min-w-8 items-center justify-center px-2 sm:h-[46px] sm:min-w-[46px] sm:px-3"
            >
              ...
            </span>
          ) : (
            <button
              key={pageNumber}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-md px-2 hover:bg-[#eef6f4] hover:text-[#025d54] sm:h-[46px] sm:min-w-[46px] sm:px-3",
                pageNumber === page && "font-semibold text-[#025d54]",
              )}
              aria-current={pageNumber === page ? "page" : undefined}
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </button>
          ),
        )}
        <button
          className="inline-flex h-8 items-center gap-1 px-1.5 hover:text-[#025d54] disabled:cursor-not-allowed disabled:opacity-40 sm:h-[46px] sm:gap-2 sm:px-2"
          disabled={page === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        >
          Next
          <ArrowRight className="h-3.5 w-3.5 sm:h-[18px] sm:w-[18px]" />
        </button>
      </nav>
    </footer>
  );
}

function BarcodeModal({ barcodeFor, onClose }: { barcodeFor: string | null; onClose: () => void }) {
  return (
    <Modal open={!!barcodeFor} onClose={onClose} title="Test Barcode" width="sm">
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="flex h-32 w-64 items-center justify-center rounded-md border border-border bg-surface-muted">
          <Barcode value={barcodeFor ?? ""} showValue={false} className="!flex-col-reverse" />
        </div>
        <div className="font-mono text-sm font-semibold tracking-widest">{barcodeFor}</div>
        <div className="flex w-full gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Share
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => window.print()}>
            Print
          </Button>
          <Button className="flex-1" onClick={onClose}>
            Download
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PriceModal({
  test,
  onClose,
  onSave,
}: {
  test: LabTest | null;
  onClose: () => void;
  onSave: (test: LabTest, price: number) => void;
}) {
  const [price, setPrice] = useState("");

  if (!test) return null;

  const value = price || String(test.price);

  return (
    <Modal open={!!test} onClose={onClose} title="Edit Price" width="sm">
      <div className="space-y-5 p-6">
        <div>
          <p className="text-sm font-bold text-foreground">{test.name}</p>
          <p className="mt-1 text-xs font-medium text-muted-foreground">{test.code}</p>
        </div>
        <label className="block">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Price</span>
          <input
            value={value}
            onChange={(event) => setPrice(event.target.value)}
            type="number"
            min="0"
            className="mt-2 h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-[#025d54]"
          />
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(test, Number(value) || 0);
              setPrice("");
            }}
          >
            Save Price
          </Button>
        </div>
      </div>
    </Modal>
  );
}

type DetailsEditorState =
  | {
      type: "test";
      item: LabTest;
    }
  | {
      type: "package";
      item: TestPackage;
    };

function DetailsModal({
  editor,
  onClose,
  onSave,
}: {
  editor: DetailsEditorState | null;
  onClose: () => void;
  onSave: (editor: DetailsEditorState) => void;
}) {
  const [draft, setDraft] = useState<DetailsEditorState | null>(null);
  const activeDraft = draft?.item.code === editor?.item.code ? draft : editor;

  if (!editor || !activeDraft) return null;

  const updateItem = (patch: Partial<LabTest> | Partial<TestPackage>) => {
    setDraft((current) => {
      const base = current?.item.code === editor.item.code ? current : editor;

      return {
        ...base,
        item: {
          ...base.item,
          ...patch,
        },
      } as DetailsEditorState;
    });
  };

  return (
    <Modal open={!!editor} onClose={onClose} title="Edit Details" width="md">
      <div className="grid gap-4 p-6">
        <EditableField
          label={activeDraft.type === "test" ? "Test Name" : "Package Name"}
          value={activeDraft.item.name}
          onChange={(value) => updateItem({ name: value })}
        />
        <EditableField
          label="Code"
          value={activeDraft.item.code}
          onChange={(value) => updateItem({ code: value })}
        />
        {activeDraft.type === "test" ? (
          <>
            <EditableField
              label="Department"
              value={activeDraft.item.department}
              onChange={(value) => updateItem({ department: value })}
            />
            <EditableField
              label="Category"
              value={activeDraft.item.category}
              onChange={(value) => updateItem({ category: value })}
            />
            <EditableField
              label="Specimen"
              value={activeDraft.item.specimen}
              onChange={(value) => updateItem({ specimen: value })}
            />
          </>
        ) : (
          <EditableField
            label="Description"
            value={activeDraft.item.description}
            onChange={(value) => updateItem({ description: value })}
          />
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onSave(activeDraft);
              setDraft(null);
            }}
          >
            Save Details
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function EditableField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-10 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-[#025d54]"
      />
    </label>
  );
}

function uniqueValues(values: string[]) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

function buildPagination(page: number, totalPages: number): Array<number | "..."> {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (page <= 3) return [1, 2, 3, "...", totalPages];
  if (page >= totalPages - 2) return [1, "...", totalPages - 2, totalPages - 1, totalPages];

  return [1, "...", page, "...", totalPages];
}
