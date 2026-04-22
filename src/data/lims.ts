/**
 * Mock data layer for the LIMS / Lab Order module.
 * Everything visible in the UI is derived from this file so that components
 * can later be wired to a real API with minimal changes.
 */

export type OrderStatus =
  | "order_confirmed"
  | "sample_collected"
  | "result_entered"
  | "validation"
  | "published";

export type Priority = "normal" | "urgent";

export type SampleStatus = "not_collected" | "collected" | "rejected";

export type TestStatus =
  | "pending"
  | "in_progress"
  | "result_entered"
  | "result_approved"
  | "result_published";

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
  email: string;
  address: string;
}

export interface ReferenceRange {
  parameter: string;
  unit: string;
  rangeLow: number;
  rangeHigh: number;
  criticalLow?: number;
  criticalHigh?: number;
}

export type ParameterType =
  | "numeric"
  | "dropdown"
  | "descriptive"
  | "formula"
  | "file";

export interface TestParameter {
  id: string;
  code: string;
  name: string;
  type: ParameterType;
  unit?: string;
  range?: { low: number; high: number };
}

export interface LabTest {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  department: string;
  category: string;
  subCategory?: string;
  specimen: string;
  container?: string;
  shelfLife?: string;
  price: number;
  enabled: boolean;
  parameters?: ReferenceRange[];
  testParameters?: TestParameter[];
}

export interface TestPackage {
  id: string;
  code: string;
  name: string;
  description: string;
  testCount: number;
  enabled: boolean;
}

export interface OrderTest {
  testId: string;
  qty: number;
  price: number;
  discount?: number;
  status: TestStatus;
  assignedTo?: string;
  resultEntryUrl?: string;
}

export interface OrderSample {
  id: string;
  type: string;
  status: SampleStatus;
  collectedBy?: string;
  collectedAt?: string;
  testIds: string[];
  container?: string;
  volume?: string;
  fasting?: string;
  instructions?: string[];
}

export interface TimelineEvent {
  key:
    | "order_confirmed"
    | "sample_collected"
    | "processing"
    | "result_entered"
    | "validation"
    | "published";
  label: string;
  timestamp?: string;
  by?: string;
  state: "done" | "current" | "todo";
}

export interface InvoiceActivity {
  id: string;
  type: "created" | "shared" | "printed" | "payment" | "cancelled" | "note";
  title: string;
  description?: string;
  by: string;
  at: string;
}

export interface Order {
  id: string;
  number: string;
  patientId: string;
  status: OrderStatus;
  priority: Priority;
  testCount: number;
  referredBy: string;
  createdAt: string;
  source: "Walk-in" | "Referral" | "OPD" | "IPD";
  invoiceNo?: string;
  paymentStatus?: "Paid" | "Unpaid" | "Partial";
  paymentMethod?: string;
  transactionId?: string;
  paymentDate?: string;
  tests: OrderTest[];
  samples: OrderSample[];
  timeline: TimelineEvent[];
  invoiceActivity?: InvoiceActivity[];
  totals: {
    subtotal: number;
    doctorFee: number;
    discount: number;
    gstPct: number;
    gst: number;
    total: number;
    paid: number;
  };
}

/* ────────────────────────────────────────────────────────────── patients */

export const patients: Patient[] = [
  {
    id: "PAT-8821",
    name: "Arjun Menon",
    age: 34,
    gender: "Male",
    phone: "+91 98430 21234",
    email: "arjun@gmail.com",
    address: "Thrissur, Kerala — 673614",
  },
  {
    id: "PAT-8820",
    name: "Arya MS",
    age: 29,
    gender: "Female",
    phone: "+91 98765 43210",
    email: "arya.ms@gmail.com",
    address: "Kozhikode, Kerala",
  },
  {
    id: "PAT-8819",
    name: "Jeeva J",
    age: 36,
    gender: "Male",
    phone: "+91 98765 11111",
    email: "jeeva@gmail.com",
    address: "Ernakulam, Kerala",
  },
  {
    id: "PAT-8818",
    name: "Gayathri Haridas",
    age: 34,
    gender: "Female",
    phone: "+91 98765 22222",
    email: "gayathri@gmail.com",
    address: "Thrissur, Kerala",
  },
  {
    id: "PAT-8817",
    name: "Andrews",
    age: 45,
    gender: "Male",
    phone: "+91 98765 33333",
    email: "andrews@gmail.com",
    address: "Palakkad, Kerala",
  },
  {
    id: "PAT-8816",
    name: "Swetha Maneesh",
    age: 34,
    gender: "Female",
    phone: "+91 98765 44444",
    email: "swetha@gmail.com",
    address: "Kollam, Kerala",
  },
  {
    id: "PAT-8815",
    name: "Arjun Ashokan",
    age: 34,
    gender: "Male",
    phone: "+91 98765 55555",
    email: "arjun.a@gmail.com",
    address: "Thiruvananthapuram, Kerala",
  },
  {
    id: "PAT-8814",
    name: "Saradha Devi",
    age: 75,
    gender: "Female",
    phone: "+91 98765 66666",
    email: "saradha@gmail.com",
    address: "Alappuzha, Kerala",
  },
  {
    id: "PAT-8813",
    name: "Kavya Nayan",
    age: 50,
    gender: "Female",
    phone: "+91 98765 77777",
    email: "kavya@gmail.com",
    address: "Kannur, Kerala",
  },
];

export const getPatient = (id: string): Patient | undefined =>
  patients.find((p) => p.id === id);

/* ─────────────────────────────────────────────────────── tests + packages */

export const departments = [
  "Hematology",
  "Biochemistry",
  "Pathology",
  "Radiology",
  "Microbiology",
  "Immunology",
];

export const labTests: LabTest[] = [
  {
    id: "CBC-001",
    code: "CBC-001",
    name: "Complete Blood Count",
    shortName: "CBC",
    department: "Hematology",
    category: "Clinical Pathology",
    subCategory: "Routine",
    specimen: "Blood",
    container: "EDTA Lavender Top",
    shelfLife: "24 hrs",
    price: 300,
    enabled: true,
    parameters: [
      { parameter: "Hemoglobin", unit: "g/dL", rangeLow: 13.5, rangeHigh: 17.5, criticalLow: 7, criticalHigh: 20 },
      { parameter: "WBC Count", unit: "10³/µL", rangeLow: 4, rangeHigh: 11, criticalLow: 2, criticalHigh: 30 },
      { parameter: "Platelet Count", unit: "10³/µL", rangeLow: 150, rangeHigh: 450, criticalLow: 50, criticalHigh: 1000 },
      { parameter: "MCV", unit: "fL", rangeLow: 80, rangeHigh: 100 },
      { parameter: "MCH", unit: "pg", rangeLow: 27, rangeHigh: 33 },
      { parameter: "MCHC", unit: "g/dL", rangeLow: 32, rangeHigh: 36 },
      { parameter: "Hematocrit", unit: "%", rangeLow: 41, rangeHigh: 53 },
      { parameter: "RBC Count", unit: "10⁶/µL", rangeLow: 4.5, rangeHigh: 5.9 },
    ],
  },
  {
    id: "LFT-001",
    code: "LFT-001",
    name: "Liver Function Test",
    shortName: "LFT",
    department: "Biochemistry",
    category: "Biochemistry",
    subCategory: "Liver Panel",
    specimen: "Blood",
    container: "SST Yellow Top",
    shelfLife: "48 hrs",
    price: 460,
    enabled: true,
    parameters: [
      { parameter: "SGPT (ALT)", unit: "U/L", rangeLow: 7, rangeHigh: 56 },
      { parameter: "SGOT (AST)", unit: "U/L", rangeLow: 10, rangeHigh: 40 },
      { parameter: "Total Bilirubin", unit: "mg/dL", rangeLow: 0.1, rangeHigh: 1.2 },
      { parameter: "Alkaline Phosphatase", unit: "U/L", rangeLow: 44, rangeHigh: 147 },
    ],
  },
  {
    id: "THY-004",
    code: "THY-004",
    name: "Thyroid Profile (T3/T4/TSH)",
    shortName: "TSH",
    department: "Biochemistry",
    category: "Biochemistry",
    specimen: "Blood",
    container: "SST Yellow Top",
    shelfLife: "48 hrs",
    price: 700,
    enabled: true,
    parameters: [
      { parameter: "T3", unit: "ng/dL", rangeLow: 80, rangeHigh: 200 },
      { parameter: "T4", unit: "µg/dL", rangeLow: 5, rangeHigh: 12 },
      { parameter: "TSH", unit: "µIU/mL", rangeLow: 0.4, rangeHigh: 4 },
    ],
  },
  {
    id: "URN-001",
    code: "URE-006",
    name: "Urine Routine Examination",
    shortName: "URN",
    department: "Pathology",
    category: "Clinical Pathology",
    specimen: "Urine",
    container: "Sterile Container",
    shelfLife: "12 hrs",
    price: 200,
    enabled: true,
  },
  {
    id: "VDR-007",
    code: "VDR-007",
    name: "VDRL",
    department: "Pathology",
    category: "Pathology",
    specimen: "Blood",
    price: 250,
    enabled: false,
  },
  {
    id: "HB-012",
    code: "HB-012",
    name: "HBsAg",
    department: "Hematology",
    category: "Hematology",
    specimen: "Blood",
    price: 350,
    enabled: true,
  },
  {
    id: "XRY-012",
    code: "XRY-012",
    name: "Chest X-Ray (PA View)",
    department: "Radiology",
    category: "Radiology",
    specimen: "N/A",
    price: 450,
    enabled: true,
  },
  {
    id: "LIP-003",
    code: "LIP-003",
    name: "Lipid Panel",
    department: "Hematology",
    category: "Hematology",
    specimen: "Blood",
    price: 550,
    enabled: true,
  },
  {
    id: "PT-010",
    code: "PT-010",
    name: "Prothrombin Time",
    department: "Pathology",
    category: "Pathology",
    specimen: "Blood",
    price: 280,
    enabled: true,
  },
];

export const getTest = (id: string) => labTests.find((t) => t.id === id);

export const testPackages: TestPackage[] = [
  {
    id: "PK-001",
    code: "PK-001",
    name: "Basic Health Checkup",
    description: "Essential tests for routine health screening",
    testCount: 5,
    enabled: true,
  },
  {
    id: "PK-002",
    code: "PK-002",
    name: "Comprehensive Health Screen",
    description: "Full body health assessment with 10 key tests",
    testCount: 8,
    enabled: true,
  },
  {
    id: "PK-004",
    code: "PK-004",
    name: "Diabetes Management Panel",
    description: "Monitor and manage diabetes with essential tests",
    testCount: 5,
    enabled: true,
  },
  {
    id: "PK-006",
    code: "PK-006",
    name: "Cardiac Risk Assessment",
    description: "Comprehensive heart health and cardiovascular markers",
    testCount: 3,
    enabled: true,
  },
  {
    id: "PK-007",
    code: "PK-007",
    name: "Thyroid Complete Panel",
    description: "Full thyroid function with T3, T4 and TSH",
    testCount: 2,
    enabled: false,
  },
  {
    id: "PK-012",
    code: "PK-012",
    name: "Liver Health Package",
    description: "Detailed liver function and hepatitis screening",
    testCount: 10,
    enabled: true,
  },
  {
    id: "PK-013",
    code: "PK-013",
    name: "Women Wellness Package",
    description: "Comprehensive screening tailored for women",
    testCount: 5,
    enabled: true,
  },
  {
    id: "PK-003",
    code: "PK-003",
    name: "Senior Citizen Screening",
    description: "Targeted tests for adults above 60+",
    testCount: 7,
    enabled: true,
  },
  {
    id: "PK-010",
    code: "PK-010",
    name: "Vitamin D Deficiency Screen",
    description: "Check for common vitamin and mineral deficiencies",
    testCount: 3,
    enabled: true,
  },
];

export const getPackage = (id: string) => testPackages.find((p) => p.id === id);

/* ─────────────────────────────────────────────────────────────── orders */

export const referringDoctors = [
  "Dr. Anand K.",
  "Dr. Akash",
  "Dr. Roopa",
  "Dr. Rekha Suresh",
  "Abc Clinic",
];

export const collectionLocations = [
  "Lab — Room 102",
  "OPD — Room 4",
  "Home Visit",
  "IPD Ward — 3A",
];

export const technicians = [
  "Tech. Sreeja R.",
  "Tech. Anand",
  "Tech. Meera",
  "Tech. Suresh",
];

const baseDate = "2026-03-17T08:14:00";

const stdSampleInstructions = [
  "Collect 4ml whole blood in EDTA (lavender top) tube",
  "Mix gently 8-10 times by inversion",
  "Keep at room temperature, transport within 2 hours",
];

const buildTimeline = (status: OrderStatus): TimelineEvent[] => {
  const order = ["order_confirmed", "sample_collected", "processing", "result_entered", "validation", "published"] as const;
  const labels: Record<typeof order[number], string> = {
    order_confirmed: "Order Confirmed",
    sample_collected: "Sample collected",
    processing: "Processing",
    result_entered: "Result entered",
    validation: "Validation pending",
    published: "Result Published",
  };
  const map: Record<OrderStatus, number> = {
    order_confirmed: 1,
    sample_collected: 2,
    result_entered: 4,
    validation: 5,
    published: 6,
  };
  const reachedIdx = map[status] - 1;
  return order.map((k, i): TimelineEvent => ({
    key: k,
    label: labels[k],
    timestamp: i <= reachedIdx ? baseDate : undefined,
    by: i === 0 ? "Reception · Neethu" : i <= reachedIdx ? "Tech. Sreeja" : undefined,
    state: i < reachedIdx ? "done" : i === reachedIdx ? "current" : "todo",
  }));
};

export const orders: Order[] = [
  {
    id: "ORD-1041",
    number: "ORD-1041",
    patientId: "PAT-8821",
    status: "order_confirmed",
    priority: "urgent",
    testCount: 3,
    referredBy: "Dr. Akash",
    createdAt: baseDate,
    source: "Walk-in",
    invoiceNo: "INV-2026-1041",
    paymentStatus: "Paid",
    paymentMethod: "UPI",
    transactionId: "TXN-9931290",
    paymentDate: "2026-03-17T08:20:00",
    tests: [
      { testId: "CBC-001", qty: 1, price: 300, status: "in_progress", assignedTo: "Tech. Sreeja" },
      { testId: "LFT-001", qty: 1, price: 460, status: "result_entered" },
      { testId: "URN-001", qty: 1, price: 200, status: "pending" },
    ],
    samples: [
      {
        id: "SMPL-2025-0101",
        type: "Blood",
        status: "collected",
        collectedBy: "Tech. Sreeja R.",
        collectedAt: "2026-03-17T08:28:00",
        testIds: ["CBC-001", "LFT-001"],
        container: "EDTA Lavender Top",
        volume: "4 ml",
        fasting: "Required (8-12 hrs)",
        instructions: stdSampleInstructions,
      },
      {
        id: "SMPL-2025-0102",
        type: "Urine",
        status: "not_collected",
        testIds: ["URN-001"],
        container: "Sterile Container",
        volume: "30 ml",
        fasting: "Not required",
        instructions: [
          "Collect midstream urine in sterile container",
          "Submit within 1 hour of collection",
        ],
      },
    ],
    timeline: buildTimeline("order_confirmed"),
    invoiceActivity: [
      {
        id: "INV-ACT-1041-1",
        type: "created",
        title: "Invoice generated",
        description: "Invoice created for walk-in lab order.",
        by: "Reception · Neethu",
        at: "2026-03-17T08:16:00",
      },
      {
        id: "INV-ACT-1041-2",
        type: "payment",
        title: "Payment received",
        description: "Full amount collected through UPI.",
        by: "Cashier · Anjana",
        at: "2026-03-17T08:20:00",
      },
    ],
    totals: {
      subtotal: 960,
      doctorFee: 0,
      discount: 0,
      gstPct: 18,
      gst: 172.8,
      total: 1132.8,
      paid: 1132.8,
    },
  },
  {
    id: "ORD-1040",
    number: "ORD-1040",
    patientId: "PAT-8820",
    status: "published",
    priority: "normal",
    testCount: 5,
    referredBy: "Dr. Akash",
    createdAt: baseDate,
    source: "OPD",
    invoiceNo: "INV-2026-1040",
    paymentStatus: "Paid",
    paymentMethod: "Card",
    transactionId: "TXN-9931180",
    paymentDate: "2026-03-17T08:00:00",
    tests: [
      { testId: "CBC-001", qty: 1, price: 300, status: "result_published" },
      { testId: "LFT-001", qty: 1, price: 460, status: "result_published" },
      { testId: "THY-004", qty: 1, price: 700, status: "result_published" },
      { testId: "LIP-003", qty: 1, price: 550, status: "result_published" },
      { testId: "URN-001", qty: 1, price: 200, status: "result_published" },
    ],
    samples: [
      {
        id: "SMPL-2025-0091",
        type: "Blood",
        status: "collected",
        collectedBy: "Tech. Anand",
        collectedAt: "2026-03-17T07:30:00",
        testIds: ["CBC-001", "LFT-001", "THY-004", "LIP-003"],
        container: "EDTA + SST",
        volume: "8 ml",
        fasting: "Required (8-12 hrs)",
        instructions: stdSampleInstructions,
      },
      {
        id: "SMPL-2025-0092",
        type: "Urine",
        status: "collected",
        collectedBy: "Tech. Anand",
        collectedAt: "2026-03-17T07:35:00",
        testIds: ["URN-001"],
      },
    ],
    timeline: buildTimeline("published"),
    invoiceActivity: [
      {
        id: "INV-ACT-1040-1",
        type: "created",
        title: "Invoice generated",
        description: "Invoice created for OPD order.",
        by: "Reception · Neethu",
        at: "2026-03-17T07:48:00",
      },
      {
        id: "INV-ACT-1040-2",
        type: "payment",
        title: "Payment received",
        description: "Full amount collected through card.",
        by: "Cashier · Priya",
        at: "2026-03-17T08:00:00",
      },
      {
        id: "INV-ACT-1040-3",
        type: "printed",
        title: "Invoice printed",
        description: "Printed at front desk for patient copy.",
        by: "Reception · Neethu",
        at: "2026-03-17T08:05:00",
      },
    ],
    totals: {
      subtotal: 2210,
      doctorFee: 0,
      discount: 60,
      gstPct: 18,
      gst: 387,
      total: 2537,
      paid: 2537,
    },
  },
  {
    id: "ORD-1039",
    number: "ORD-1039",
    patientId: "PAT-8819",
    status: "sample_collected",
    priority: "normal",
    testCount: 1,
    referredBy: "Dr. Akash",
    createdAt: baseDate,
    source: "OPD",
    tests: [{ testId: "CBC-001", qty: 1, price: 300, status: "in_progress", assignedTo: "Tech. Meera" }],
    samples: [
      {
        id: "SMPL-2025-0081",
        type: "Blood",
        status: "collected",
        collectedBy: "Tech. Meera",
        collectedAt: "2026-03-17T08:15:00",
        testIds: ["CBC-001"],
        container: "EDTA Lavender Top",
        volume: "3 ml",
        fasting: "Not required",
      },
    ],
    timeline: buildTimeline("sample_collected"),
    totals: { subtotal: 300, doctorFee: 0, discount: 0, gstPct: 18, gst: 54, total: 354, paid: 0 },
  },
  {
    id: "ORD-1038",
    number: "ORD-1038",
    patientId: "PAT-8818",
    status: "result_entered",
    priority: "normal",
    testCount: 6,
    referredBy: "Dr Roopa",
    createdAt: baseDate,
    source: "Referral",
    tests: [
      { testId: "CBC-001", qty: 1, price: 300, status: "result_entered" },
      { testId: "LFT-001", qty: 1, price: 460, status: "result_approved" },
      { testId: "THY-004", qty: 1, price: 700, status: "result_entered" },
    ],
    samples: [
      {
        id: "SMPL-2025-0071",
        type: "Blood",
        status: "collected",
        collectedBy: "Tech. Sreeja R.",
        collectedAt: "2026-03-17T07:20:00",
        testIds: ["CBC-001", "LFT-001", "THY-004"],
      },
    ],
    timeline: buildTimeline("result_entered"),
    totals: { subtotal: 1900, doctorFee: 0, discount: 0, gstPct: 18, gst: 342, total: 2242, paid: 0 },
  },
  {
    id: "ORD-1037",
    number: "ORD-1037",
    patientId: "PAT-8817",
    status: "sample_collected",
    priority: "urgent",
    testCount: 8,
    referredBy: "Dr Roopa",
    createdAt: baseDate,
    source: "Walk-in",
    tests: [],
    samples: [],
    timeline: buildTimeline("sample_collected"),
    totals: { subtotal: 2950, doctorFee: 0, discount: 0, gstPct: 18, gst: 531, total: 3481, paid: 0 },
  },
  {
    id: "ORD-1036",
    number: "ORD-1036",
    patientId: "PAT-8816",
    status: "validation",
    priority: "normal",
    testCount: 4,
    referredBy: "Dr Roopa",
    createdAt: baseDate,
    source: "Referral",
    tests: [
      { testId: "CBC-001", qty: 1, price: 300, status: "result_approved" },
      { testId: "LFT-001", qty: 1, price: 460, status: "result_approved" },
    ],
    samples: [
      {
        id: "SMPL-2025-0061",
        type: "Blood",
        status: "collected",
        collectedBy: "Tech. Sreeja R.",
        collectedAt: "2026-03-17T07:10:00",
        testIds: ["CBC-001", "LFT-001"],
      },
    ],
    timeline: buildTimeline("validation"),
    totals: { subtotal: 1450, doctorFee: 0, discount: 0, gstPct: 18, gst: 261, total: 1711, paid: 1711 },
  },
  {
    id: "ORD-1035",
    number: "ORD-1035",
    patientId: "PAT-8815",
    status: "validation",
    priority: "urgent",
    testCount: 4,
    referredBy: "Abc Clinic",
    createdAt: baseDate,
    source: "Referral",
    tests: [],
    samples: [],
    timeline: buildTimeline("validation"),
    totals: { subtotal: 1500, doctorFee: 0, discount: 0, gstPct: 18, gst: 270, total: 1770, paid: 0 },
  },
  {
    id: "ORD-1034",
    number: "ORD-1034",
    patientId: "PAT-8814",
    status: "published",
    priority: "normal",
    testCount: 3,
    referredBy: "Abc Clinic",
    createdAt: baseDate,
    source: "Referral",
    tests: [],
    samples: [],
    timeline: buildTimeline("published"),
    totals: { subtotal: 1100, doctorFee: 0, discount: 0, gstPct: 18, gst: 198, total: 1298, paid: 1298 },
  },
  {
    id: "ORD-1033",
    number: "ORD-1033",
    patientId: "PAT-8813",
    status: "result_entered",
    priority: "normal",
    testCount: 2,
    referredBy: "Abc Clinic",
    createdAt: baseDate,
    source: "Referral",
    tests: [],
    samples: [],
    timeline: buildTimeline("result_entered"),
    totals: { subtotal: 800, doctorFee: 0, discount: 0, gstPct: 18, gst: 144, total: 944, paid: 0 },
  },
];

export const getOrder = (id: string) =>
  orders.find((o) => o.id === id || o.number === id);

/* ─────────────────────────────────────────────────────────── dashboard */

export const dashboardKpis = [
  { key: "pending", label: "Pending Collection", value: 18, delta: "+3", icon: "hourglass" },
  { key: "processing", label: "In Processing", value: 45, delta: "+3", icon: "flask" },
  { key: "validation", label: "Awaiting Validation", value: 23, delta: "+3", icon: "clipboard" },
  { key: "critical", label: "Critical Results", value: 4, delta: "+3", icon: "alert" },
  { key: "tat", label: "Avg Turnaround Time", value: "4.2", suffix: "hrs", delta: "-0.5", icon: "timer" },
] as const;

export const mostOrderedTests = [
  { code: "CBC", value: 200, color: "oklch(0.7 0.16 220)" },
  { code: "FBS", value: 110, color: "oklch(0.55 0.18 265)" },
  { code: "HBA1C", value: 150, color: "oklch(0.72 0.16 70)" },
  { code: "LFT", value: 100, color: "oklch(0.65 0.2 350)" },
  { code: "TSH", value: 195, color: "oklch(0.7 0.18 145)" },
] as const;

export const orderVolume7d = [
  { day: "Sun", value: 60 },
  { day: "Mon", value: 95 },
  { day: "Tue", value: 70 },
  { day: "Wed", value: 110 },
  { day: "Thu", value: 80 },
  { day: "Fri", value: 60 },
  { day: "Sat", value: 130 },
] as const;

export const machineSummary = [
  { key: "online", label: "Machines Online", value: "7/8", tone: "info" as const, icon: "monitor" },
  { key: "queue", label: "Samples in Queue", value: "12", tone: "warning" as const, icon: "flask" },
  { key: "errors_a", label: "Machine Errors", value: "02", tone: "danger" as const, icon: "alert" },
  { key: "errors_b", label: "Machine Errors", value: "02", tone: "danger" as const, icon: "alert" },
];

export const connectedAnalyzers = [
  { name: "Hematology Analyzer", id: "M001", queue: 5, online: true },
  { name: "Chemistry Analyzer", id: "M002", queue: 4, online: true },
  { name: "Immunoassay Analyzer", id: "M003", queue: 3, online: true },
  { name: "Coagulation Analyzer", id: "M004", queue: 0, online: false },
];

export const technicianPerformance = [
  { name: "John Smith", completed: 45, pending: 3 },
  { name: "Sarah Johnson", completed: 38, pending: 5 },
  { name: "Mike Wilson", completed: 42, pending: 2 },
  { name: "Emily Davis", completed: 35, pending: 4 },
];

/* ────────────────────────────────────────────────────────────── helpers */

export const formatINR = (n: number) =>
  `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${date}, ${time}`;
};

export const orderStatusMeta: Record<
  OrderStatus,
  { label: string; tone: "info" | "warning" | "danger" | "success" | "violet" }
> = {
  order_confirmed: { label: "Order Confirmed", tone: "info" },
  sample_collected: { label: "Sample Collected", tone: "warning" },
  result_entered: { label: "Result Entered", tone: "info" },
  validation: { label: "Validation", tone: "violet" },
  published: { label: "Published", tone: "success" },
};

export const testStatusMeta: Record<
  TestStatus,
  { label: string; tone: "info" | "warning" | "danger" | "success" | "violet" | "neutral" }
> = {
  pending: { label: "Pending", tone: "warning" },
  in_progress: { label: "In Progress", tone: "warning" },
  result_entered: { label: "Result Entered", tone: "danger" },
  result_approved: { label: "Result Approved", tone: "success" },
  result_published: { label: "Result Published", tone: "success" },
};
