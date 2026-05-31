export type CriterionAnswer = 'yes' | 'no' | 'na' | '';

export interface Criterion {
  id: string;
  text: string;
  guide: string;
  parentId?: string;
}

export interface Domain {
  id: string;
  number: string;
  name: string;
  criteria: Criterion[];
}

export interface Section {
  id: string;
  name: string;
  domains: Domain[];
}

export interface HospitalInfo {
  hospitalName: string;
  location: string;
  ceoName: string;
  ceoPhone: string;
  ceoEmail: string;
  medicalDirector: string;
  mdPhone: string;
  mdEmail: string;
  ipcLeader: string;
  ipcPhone: string;
  assessmentDate: string;
  previousAssessmentDate: string;
  totalHealthProfessionals: string;
  totalSupportStaff: string;
  totalBeds: string;
  assessorNames: string;
}

export type AssessmentData = Record<string, {
  answer: CriterionAnswer;
  comment: string;
}>;

// Helper to create criteria with clean text and guides
function createCriteria(prefix: string, items: { text: string; guide: string }[]): Criterion[] {
  return items.map((item, idx) => ({
    id: `${prefix}_q${idx + 1}`,
    text: item.text,
    guide: item.guide
  }));
}

// SECTION I: Capacity & System
export const sectionI: Section = {
  id: "section_i",
  name: "Section I — Capacity & System",
  domains: [
    {
      id: "sec_i_dom_1",
      number: "Domain 1",
      name: "IPC Program, Committee & Administrative Structure",
      criteria: createCriteria("i_dom1", [
        { text: "The hospital has an officially appointed, multidisciplinary IPC Committee.", guide: "Verify formal appointment letters, terms of reference, and membership representation (medical, nursing, admin, lab, pharmacy, housekeeping)." },
        { text: "The IPC Committee meets at least monthly and maintains signed meeting minutes.", guide: "Review meeting minute binder. Verify active attendance, signed records, action logs and status of previous action items." },
        { text: "A dedicated, trained IPC Focal Person/Team Lead is appointed on a full-time basis.", guide: "Confirm full-time status. Verify certificate of IPC training and formal terms of reference for the position." },
        { text: "The hospital has an approved annual IPC operational plan linked to a budget.", guide: "Verify standard budget sheets or commitment. Check if annual plan is aligned with national IPC policies and indicators." },
        { text: "Regular IPC administrative reports are submitted to the Hospital Board or CEO.", guide: "Check for monthly or quarterly report submissions with active feedback loops or signed executive comments." },
        { text: "There is an active IPC nursing/liaison team in each ward representing the focal team.", guide: "Check the lists of department ward focal reps or 'IPC champions' and verify coordinate activities." },
        { text: "The IPC program has a physical, designated office with a communication facility.", guide: "Confirm physical office spaces, computer availability, internet access and materials files." },
        { text: "A designated budget exists specifically for purchasing personal protective equipment (PPE).", guide: "Verify finance department allocation lines dedicated to critical infection control consumables." },
        { text: "The hospital possesses an incident response protocol for outbreak management.", guide: "Review written SOPs for infectious disease outbreaks (e.g., cholera, Covid, measles) with designated isolation areas." },
        { text: "The clinical team includes a resident infectious disease specialist or consulting pathologist.", guide: "Confirm qualified professional presence or a regular operational linkage with regional hospitals." },
        { text: "Quality improvement metrics regularly incorporate IPC performance results.", guide: "Confirm presentation of IPC metrics inside hospital QI or Key Performance Indicator boards." },
        { text: "There is an active antimicrobial stewardship (AMS) committee coordinating with IPC.", guide: "Check for active pharmacy-led AMS committee meetings, antibiogram reports, or formulary restriction policies." },
        { text: "An anonymous system is present for staff to report needle-stick or sharp injury risks.", guide: "Confirm active injury report forms, dropping boxes, or digital portal reporting tools." },
        { text: "Administrative authority permits the IPC officer to restrict safety-violating clinical areas.", guide: "Review administrative charter showing authority of IPC coordinator to issue stop-work orders or quarantine areas." },
        { text: "Organizational layout provides designated safe zones for pregnant staff during outbreak events.", guide: "Verify written personnel guidelines or accommodation policies during respiratory epidemic outbreaks." },
        { text: "The hospital retains legal consultations on hazardous medical waste operations safety.", guide: "Verify standard legal protocols or compliance registry records for safety waste management operations." },
        { text: "An active registry list monitors and registers licensed medical staff IPC credentials.", guide: "Confirm credential records showing updated basic IPC certificates in personnel files." },
        { text: "The IPC team participates directly in hospital planning for structural renovations.", guide: "Verify engineering check-off forms indicating IPC team has signed off on layout, HVAC, or plumbing works." },
        { text: "A patient representative participates occasionally in community health committee briefs.", guide: "Confirm community inclusion in basic hygiene advocacy briefs or advisory council meetings." },
        { text: "Institutional goals allocate financial support for advanced IPC credentialing.", guide: "Review continuous professional development (CPD) registry budgets for specialized IPC fellowships." }
      ])
    },
    {
      id: "sec_i_dom_2",
      number: "Domain 2",
      name: "IPC Guidelines, Educational Policy & SOPs",
      criteria: createCriteria("i_dom2", [
        { text: "National IPC guidelines are fully accessible to all staff inside each clinical ward.", guide: "Confirm printed or electronic copies of national IPC guidebooks are actively located in all core departments." },
        { text: "A formal onboarding program includes general IPC orientation training for all newcomers.", guide: "Verify induction attendance logs, training modules, and feedback surveys of newly joined personnel." },
        { text: "Mandatory annual IPC refresher courses are executed for all clinical and cleaners staff.", guide: "Check annual schedules. Verify participation lists of clinical staff and support cleaners." },
        { text: "Specific written SOPs outline aseptic techniques for urinary catheter insertions.", guide: "Verify presence of laminated or bound SOPs on ward clinic counters outlining sterile catheter placement." },
        { text: "Standard Operating Procedures (SOPs) are available in local languages for cleaners.", guide: "Request translated SOPs for environmental sanitation, waste handling, and chemical dilutions." },
        { text: "Job Aids for diluted chemical disinfectant calculations are posted directly at mixing sinks.", guide: "Check for laminated wall charts showing correct mixing ratios (e.g., chlorine, bleach) next to cleaning sinks." },
        { text: "Handwashing posters matching WHO guidelines are displayed at every single clinical hand sink.", guide: "Conduct observation across the hospital. Confirm WHO 5-Moments poster is visible next to all wash stations." },
        { text: "SOPs are available for clinical evaluation of patients with suspected air-borne diseases.", guide: "Check triage desks for respiratory isolation SOPs and criteria for assigning isolation masks." },
        { text: "Educational sessions include specific materials regarding safe medication preparation.", guide: "Confirm safe handling training logs for multi-dose vials, parenteral products, or chemotherapy." },
        { text: "Patients and guest instructions for cough etiquette are clearly posted in public areas.", guide: "Verify notices on respiratory hygiene, covering coughs, and waste bin uses inside waiting halls." },
        { text: "Information kits regarding vaccine-preventable diseases are distributed to staff members.", guide: "Verify availability of brochures or electronic materials with advice on HBV, Influenza, and Tetanus vaccinations." },
        { text: "The hospital maintains records of routine assessment testing for clinical staff hygiene skills.", guide: "Check laboratory or training division registries showing practical audits of aseptic skill check-offs." },
        { text: "Regular mock drills are scheduled to practice outbreak response and donning/doffing techniques.", guide: "Verify recorded drills of donning/doffing PPE, patient evacuation, and temporary quarantine zones." },
        { text: "Clear directions for needle-stick occupational prophylaxis are visible near high-risk zones.", guide: "Check emergency unit, operating theater, and labor ward for posted PEP (Post-Exposure Prophylaxis) paths." },
        { text: "Institutional manuals dictate patient isolation protocols for multi-drug resistant germs.", guide: "Verify standard guidelines detailing contact precautions and room assignments for MDRO patients (MRSA, CRE)." },
        { text: "Orientation materials cover chemical hazards and MSDS sheets for environmental sanitizers.", guide: "Verify accessibility of Material Safety Data Sheets (MSDS) in the cleaning staff locker or storage room." },
        { text: "Specific training manuals address infection risks inside pediatric and neonatal critical wards.", guide: "Verify dedicated pediatric protocols dealing with septicemia, nursery hygiene, and formula safety." },
        { text: "Clinical protocols detail correct standard procedures for handling contaminated linen.", guide: "Check for written guidelines for separate storage, sorting, and washing of soiled vs infectious linen." },
        { text: "Guidelines exists for the safe reprocessing of disposable single-use items, of permitted.", guide: "Confirm written directives clearly banning or outlining the tight protocols for reprocessing and testing if done." },
        { text: "A formal testing platform evaluates clinical staff competency regarding sterile field setups.", guide: "Observe training module certifications for surgical theater assistants and nurses." }
      ])
    },
    {
      id: "sec_i_dom_3",
      number: "Domain 3",
      name: "Built Environment & WASH (Water, Sanitation, Hygiene)",
      criteria: createCriteria("i_dom3", [
        { text: "Continuous flow of clean tap water is available 24/7 across all clinical departments.", guide: "Confirm access to water mains or high-capacity backup reservoirs showing non-interrupted service." },
        { text: "Water quality bacteriological and chemical audits are performed at least quarterly.", guide: "Review test results from external laboratories or public health inspectors. Confirm nil coliform counts." },
        { text: "Independent water storage tanks are sanitarily protected and disinfected biannually.", guide: "Review facility maintenance schedules and chemical clean-up records for cisterns." },
        { text: "Functional sanitation latrines are separate for staff members vs patients.", guide: "Confirm clear gender-segregated toilets. Ensure separate structures for healthcare staff to control cross-infection." },
        { text: "Every hand sink incorporates high-quality swan-neck fittings or elbow-operated faucets.", guide: "Check that taps at clinical areas can be turned on/off without hands (e.g., elbows, knees, pedals, or sensors)." },
        { text: "Hand wash sinks are directly connected to functional plumbing with a grease-trap drain.", guide: "Sinks should not drain onto floors or open channels. Plumbing must represent fully closed systems." },
        { text: "The neonatal nursing unit contains dedicated warm water systems for wash procedures.", guide: "Confirm presence of instant thermostatic mixers or heavy-duty water boilers supplying nursery sinks." },
        { text: "All ward layouts maintain a minimum space distance of 1.5 meters between patient beds.", guide: "Measure distance between adjacent beds in medical, surgical, and pediatric wards to verify spacing." },
        { text: "The hospital features fully functional ventilation systems in all critical clinical units.", guide: "Check operating theaters, isolation units, and ICU for functional air changes (or HEPA filtration if standard)." },
        { text: "An independent auxiliary power generator serves waste ovens and environmental processing.", guide: "Confirm backup power supply is ready to run essential autoclaves and support systems without delay." },
        { text: "Patient shower structures feature slip-resistant surfaces and clean privacy panels.", guide: "Check showers for hygiene, mildew-free drains, slip-resistant mats, or structured floor grids." },
        { text: "The clinical preparation room has direct, non-carpeted, easily sanitizable solid floors.", guide: "Floors must be seamless vinyl or high-quality tiles without cracks to avoid moisture/fungal growth." },
        { text: "Hand-drying tools (disposable single-use paper towels or air blower) are available near sinks.", guide: "Confirm continuous refills of towels or mechanical air drying. Single reusable cloth towels are prohibited." },
        { text: "There is an active plumbing maintenance contract with certified technical operators.", guide: "Verify written SLA (service-level agreement) for immediate plumbing fix of sewer backflows and septic systems." },
        { text: "Air ventilation layouts provide clean-to-dirty directional airflow in COVID or TB units.", guide: "Verify regular negative pressure or well-ventilated windows directing air away from hospital corridors." },
        { text: "All public drinking water stations use reliable commercial carbon filtration machines.", guide: "Confirm presence of operational filters and documented filter cart replacement dates." },
        { text: "An active grease interceptor filters kitchen waste drains to prevent sewer blockage.", guide: "Check kitchen facility grease traps and check maintenance cleaning logs." },
        { text: "Operating theater surfaces have fully non-porous walls easily cleaned with broad-spectrum agents.", guide: "Confirm wall surfaces are coated in epoxy paint or stainless steel panels." },
        { text: "Plumbing designs include structural anti-siphon backflow valves at clinical sinks.", guide: "Verify presence of backflow prevention valves to avoid dirty drain water contaminating incoming lines." },
        { text: "Patient waiting rooms have generous floor-to-ceiling windows representing adequate natural ventilation.", guide: "Ensure total openable window area is at least 15% of the total floor space to facilitate air renewal." }
      ])
    },
    {
      id: "sec_i_dom_4",
      number: "Domain 4",
      name: "Logistics & Supply Management",
      criteria: createCriteria("i_dom4", [
        { text: "The main pharmaceutical store has continuous air conditioning and temperature logs.", guide: "Check cold chain guidelines. Red-line alert records should represent zero temperature abuse events." },
        { text: "A formal automated tracking system warns of oncoming stock-outs for critical PPE.", guide: "Verify dashboard monitors showing lead times or warning thresholds for gloves, masks, and caps." },
        { text: "Standard liquid soap is stored in airtight, single-use factory bags or clean dispensers.", guide: "Confirm soap is not top-filled without sanitizer washes, as open top soap feeds easily breed Pseudomonas germs." },
        { text: "High-level alcohol-based hand rub is manufactured locally with WHO guidelines if possible.", guide: "Verify raw material stock (Ethanol, Glycerol, Hydrogen peroxide) and formulation logs matching requirements." },
        { text: "High-grade surgical gloves are segregated cleanly from non-sterile examination gloves.", guide: "Verify separate inventory stacks inside ward supply cupboards to prevent diagnostic mixing errors." },
        { text: "Heavy-duty cleaning gloves, boots, and aprons are sufficiently supplied for sanitation teams.", guide: "Confirm all support cleaning personnel have thick rubber gloves, waterproof aprons, and steel-toe boots." },
        { text: "The warehouse maintains a dedicated, clean chamber for sterile packaging reserves.", guide: "Keep medical sterile packets separate from dusty bulk chemicals to preserve packaging integrity." },
        { text: "Disinfectant inventory lists show active stock of premium Sodium Hypochlorite (bleach).", guide: "Verify sufficient stock volumes of bleach with valid expiration dates and verified active chorine percentage." },
        { text: "Quality testing files verify validation for imported safety syringe boxes.", guide: "Review FDA or certified lab certificates for import items confirming safety retractions operate reliably." },
        { text: "An organized stock rotation scheme utilizes standard 'First-Expired, First-Out' (FEFO).", guide: "Verify oldest items near front of shelves. Expiration dates must reflect clear active monitoring." },
        { text: "Adequate supplies of N95 respirators are regularly stocked and size-fitted to staff.", guide: "Check inventory for N95 masks of multiple sizes (regular, small) and check size-fit roster reports." },
        { text: "Appropriate fluid-resistant gowns are stocked for the delivery room and trauma units.", guide: "Verify abundance of surgical full gowns showing verified fluid barrier properties." },
        { text: "Chemical indicator strips are sufficiently stocked for steam sterilization testing.", guide: "Check supply bins for Class 4, 5, or 6 chemical indicators and biological indicator vials." },
        { text: "A specialized quarantine area is used for storing compromised or expired pharmaceuticals.", guide: "Prevent mix-ups by locking expired supplies under lock and key away from standard active piles." },
        { text: "Disinfectant supplies reflect availability of 70% Isopropyl Alcohol for cleanings.", guide: "Check inventory logs for medical-grade rubbing alcohol used for injection site prep and equipment friction." },
        { text: "The hospital maintains direct back-up agreements with chemical and hygiene suppliers.", guide: "Review written safety vendor agreements providing emergency delivery within 12 hours of shortage alert." },
        { text: "Color-coded waste bins (yellow, red, black) are distributed to stores in abundant quantities.", guide: "Confirm adequate backup stocks of heavy-gauge bin liners and color bins in the logistics room." },
        { text: "Safety eyewear or visor masks are available in key clinics to shield splash risks.", guide: "Confirm stock of reusable goggles, face shields, or visor masks in emergency and maternity blocks." },
        { text: "Proper safety containment is applied for transporting concentrated chlorine powders.", guide: "Ensure chlorine powders are sealed in air-tight, thick plastic containers inside chemical lockers." },
        { text: "A dedicated stock sheet tracks consumption ratios of antiseptic hand gels per ward.", guide: "Review ward usage reports. Abnormal dips in hand sanitizer usage should trigger compliance reviews." }
      ])
    },
    {
      id: "sec_i_dom_5",
      number: "Domain 5",
      name: "Occupational Health & Surveillance",
      criteria: createCriteria("i_dom5", [
        { text: "A detailed registry tracks all staff vaccination statuses for Hepatitis B Virus (HBV).", guide: "Review personnel files. Confirm active list of complete 3-dose HBV vaccine completions." },
        { text: "Pre-employment medical screenings are standard for all newly hired healthcare workers.", guide: "Check recruitment files for standard physicals, CXR, and infection screening sign-offs." },
        { text: "An emergency workflow details immediate care post-accidental needle-stick exposure.", guide: "Check if the process includes post-exposure evaluation, laboratory tests, PEP dispensing, and counseling." },
        { text: "Routine annual screening for Latent Tuberculosis Infection is organized for staff.", guide: "Confirm provision of annual TST (Tuberculin skin tests) or IGRA tests for high-risk ward personnel." },
        { text: "The hospital provides annual influenza vaccinations to all critical care clinical staff.", guide: "Review vaccine registry for winter flu campaign logs covering staff inside neonatal, dialysis, and ICU units." },
        { text: "A specialized register logs all recorded sharp injury incidents with root-cause analysis.", guide: "Review occupational health registry book. Check for completed investigation logs and corrective steps." },
        { text: "Adequate psychological care access is available for staff during major public outbreaks.", guide: "Confirm presence of on-call counseling staff or mental health support protocols within the hospital." },
        { text: "Continuous health surveillance checks food handlers inside the hospital canteen.", guide: "Verify active clinical check-off cards (stool tests, physicals) for all chef and catering helper staff (biannually)." },
        { text: "Special isolation policies dictate sick-leave terms for infectious workers (e.g., flu, scabies).", guide: "Verify non-punitive sick leave guidelines ensuring infectious workers are barred from direct patient contact." },
        { text: "Safe counseling guidelines exist regarding standard HBV/HIV chronic infection disclosures.", guide: "Ensure standard confidentiality rules are followed to prevent stigma while ensuring employee safety." },
        { text: "Heavy chemical cleaner teams are routinely tested for chronic skin and respiratory issues.", guide: "Confirm physical examinations of cleaning workers using strong phenols, formaldehyde, or heavy acids." },
        { text: "Post-exposure prophylactic medications are kept locked but instantly available 24/7.", guide: "PEP drugs must be accessible in ER or Pharmacy night lockers. Staff must not depend on day shift to unlock PEP." },
        { text: "An active registry tracks physical injuries and cuts among the medical waste incinerator team.", guide: "Verify specific occupational records showing protective gears check-off and injury reports." },
        { text: "The hospital features structured health surveillance logs for laboratory staff.", guide: "Confirm check-ups for personnel handling live cultures, sputum samples, and biological specimen lines." },
        { text: "Clean breast-feeding nurseries are available for returning staff members.", guide: "Verify dedicated, hygienic room equipped with sink and privacy screens for nursing mothers." },
        { text: "Occupational exposure stats are analyzed and reported annually to regional health bureaus.", guide: "Review annual submission sheets showing aggregate sharps log numbers and PEP adherence." },
        { text: "Wards feature emergency eyewash stations equipped with physiological saline bottles.", guide: "Check for dedicated emergency eye wash kits or functional wall mounts in ER, Lab, and Operating Theater." },
        { text: "Staff standard physicals include vision and ergonomic strain tracking for microscopic teams.", guide: "Verify routine health check records for laboratory technicians and histopathology personnel." },
        { text: "Specific guidelines isolate immunocompromised staff from high-risk infectious patients.", guide: "Verify workflow for moving vulnerable workers (e.g. chemotherapy or pregnancy) to lower risk areas." },
        { text: "Health education boards for employee safety are maintained in local language inside breakrooms.", guide: "Ensure employee safety, hygiene, and wellness posters are highly visible in staff rest zones." }
      ])
    }
  ]
};

// SECTION II: Practices & Compliance
export const sectionII: Section = {
  id: "section_ii",
  name: "Section II — Practices & Compliance",
  domains: [
    {
      id: "sec_ii_dom_1",
      number: "Domain 6",
      name: "Hand Hygiene Compliance & Observation",
      criteria: createCriteria("ii_dom1", [
        { text: "Clinical staff perform hand hygiene before touching any patient.", guide: "Observe standard clinical interactions. Verify compliance of midwives, nurses, and doctors prior to physical contact." },
        { text: "Clinical staff perform hand hygiene before any clean or aseptic procedure.", guide: "Verify cleaning prior to wound dressing, IV cannulation, catheter placement, or administering injections." },
        { text: "Clinical staff perform hand hygiene immediately after body fluid exposure risk.", guide: "Ensure compliance after handling urine bags, wound drains, blood samples, or suction jars." },
        { text: "Clinical staff perform hand hygiene after touching a patient.", guide: "Observe staff wash or sanitize hands after finishing examination, checking vitals, or handling patient transfers." },
        { text: "Clinical staff perform hand hygiene after touching patient surroundings.", guide: "Verify hygiene after touching bedrails, tables, patient lockers, or iv stands even if patient was not touched." },
        { text: "The IPC team executes systematic, direct observational hand hygiene audits monthly.", guide: "Review completed audit tracking forms, sample sizes (ideally 200 sessions), and department-wise results." },
        { text: "Sufficient amounts of alcohol-based hand rub are active at point-of-care (e.g., bed foot/trolley).", guide: "Verify existence of working sanitizers attached directly to patient beds, trollies, or pediatric cradles." },
        { text: "Staff demonstrate proper hand washing technique using correct duration (> 40 seconds).", guide: "Verify staff scrub backs of hands, interlock fingers, clean thumbs and nailbeds under running water." },
        { text: "Liquid soap dispensers are regularly cleaned and empty pumps are sanitized prior to refilling.", guide: "Confirm that clean-up schedules exist for soap dispensers. Top-filling onto residual soap promotes contamination." },
        { text: "Sinks are continuously stocked with clean, liquid soap; bar soap is entirely absent.", guide: "Conduct a rapid spot check of sinks. Bar soap is banned in clinical fields as they act as vector surfaces." },
        { text: "Clinical staff keep nails short, clean, and entirely free of artificial decorations.", guide: "Fingernails must be short. Acrylic or gel nails and jewelry (rings, bracelets) accumulate subungual pathogen colonizations." },
        { text: "Clean, running tap water is operated using elbows, knees, or pedals without re-contaminating hands.", guide: "Verify that staff do not use washed palms to turn off traditional faucets at the end of washing." },
        { text: "Staff correctly dry their hands with single-use paper towels and use them to close traditional faucets.", guide: "Observe if paper towels are utilized as barriers to turn off high-touch knob taps." },
        { text: "Hand sanitizing gel is not rubbed on visibly soiled hands; washing with water is chosen instead.", guide: "Confirm staff wash hands with soap and water whenever visible blood, pus, or dirt contamination is present." },
        { text: "Posters detailing correct handwash and rub methods are posted directly at the point of action.", guide: "Check that clear laminated diagrams are placed on the wall directly at eye-level above washbasin units." },
        { text: "Visitor stations at entrance ways feature instruction banners and sanitizing pumps.", guide: "Verify active sanitation guards prompting family members to clean hands prior to entering inpatient wards." },
        { text: "Specialized hand scrubs are verified prior to surgical procedures for theater teams.", guide: "Check that theater staff perform surgical hand preps up to elbows with antiseptic formulations (chlorhexidine/povidone)." },
        { text: "Hand rubbing utilizes sufficient gel volumes (typically 3ml) to cover all hand surfaces.", guide: "Observe if workers squeeze standard active amounts to keep hands thoroughly wet for at least 20 seconds." },
        { text: "Clinical work trollies are continuously stocked with backup portable pocket sanitizer bottles.", guide: "Confirm that pocket-sized spray or gel bottles are issued to round-going clinical staff." },
        { text: "An active dashboard updates and shares hand hygiene compliance rates with each department.", guide: "Verify monthly peer postings or score cards displaying compliance ratios across clinical wards." },
        { text: "Maternity staff prioritize hand hygiene prior to neonatal touching or infant care.", guide: "Confirm absolute hand rubbing practices before handling newborns to prevent neonatal sepsis outbreaks." }
      ])
    },
    {
      id: "sec_ii_dom_2",
      number: "Domain 7",
      name: "PPE Compliance & Barrier Standards",
      criteria: createCriteria("ii_dom2", [
        { text: "Clinical staff don gloves only when there is anticipated risk of body fluid or tissue exposure.", guide: "Gloves should not be worn generically for clean tasks (avoid inappropriate, continuous glove usage)." },
        { text: "Gloves are removed and discarded immediately after completing care on a single patent.", guide: "Gloves must not be worn while walking between patients, touching door handles, or writing charts." },
        { text: "Hand hygiene is performed immediately before donning and also after removal of gloves.", guide: "Confirm that glove usage does not replace handwashing. Glove pores can permit minor bacterial passage." },
        { text: "Medical gowns and aprons are discarded prior to leaving the patient's immediate room/ward.", guide: "Gowns must not be worn in common corridors, offices, or canteen areas." },
        { text: "N95 respirators are worn correctly during high-risk aerosol generating procedures (AGPs).", guide: "Verify N95 usage during intubation, biological suctioning, sputum inductions, or bronchoscopies." },
        { text: "Face shields or visor screens are utilized whenever there is blood splash potential.", guide: "Check compliance during deliveries, major trauma surgeries, orthopedic drillings, and dental extractions." },
        { text: "Protective overalls and rubber boots are utilized in isolation wards or heavy cholera units.", guide: "Verify heavy-duty PPE standards inside infectious disease isolation centers." },
        { text: "Surgical paper caps are used correctly to cover all head hair during sterile line placements.", guide: "Verify that head hair is completely tucked inside surgical bouffant caps in operating theater and ICU." },
        { text: "Staff don clean footwear specifically reserved for operating theaters or critical ICU rooms.", guide: "Verify staff switch shoes or wear dedicated theater boots to prevent external soil path introductions." },
        { text: "Used, disposable PPE is discarded directly into clinical color-coded biohazard yellow bins.", guide: "Verify zero disposal of infectious gowns or masks inside common domestic black trash bins." },
        { text: "Staff demonstrate correct sequence for donning PPE (Gown, Mask, Goggles, Gloves).", guide: "Audit personnel sequence. Gown is first, while gloves must always seal over the cuffs of the gown." },
        { text: "Staff demonstrate correct sequence for doffing PPE (Gloves, Goggles, Gown, Mask).", guide: "Audit safe removal. Gloves first (most contaminated), mask last (cleanest to avoid inhalation of particulates)." },
        { text: "A designated, safe PPE doffing station is established with hand sanitizing supplies inside isolation.", guide: "Review doffing spaces. Ensure trash receptacles and sanitizers are located immediately in reaching range." },
        { text: "Staff clean or discard reusable safety goggles with approved alcohol wipes between usages.", guide: "Verify chemical disinfectant immersion bath or virucidal wipes are applied to shared plastic eye shields." },
        { text: "Single-use masks are not hung around the neck or tucked inside clinical shirt pockets.", guide: "Masks must be discarded after removal. Wearing masks around neck, on chin, or forehead is prohibited." },
        { text: "A trained mirror observer supervises high-level PPE doffings in Ebola/severe disease isolation.", guide: "Confirm presence of an appointed supervisor monitoring compliance with safe doffing steps." },
        { text: "Cleaners wear thick, heavy duty rubber utility gloves while mixing concentrated chlorine solutions.", guide: "Confirm cleaning staff have personal safety protection against toxic fumes and chemical skin burns." },
        { text: "Heavy duty linen handlers utilize waterproof aprons and thick respirators during sorting.", guide: "Confirm laundry workers have respiratory barriers to shield from dry dusts of soiled patient clothes." },
        { text: "Medical gloves are never sanitized or washed for reuse under any circumstances.", guide: "Observe staff behavior. Reusing or spraying examination gloves with alcohol is strictly banned." },
        { text: "Staff confirm that N95 respirators achieve a complete airtight seal during fit-checks.", guide: "Ensure staff perform user-seal checks (exhaling/inhaling) to verify no air leaks around mask borders." },
        { text: "Specialized radiation shields (lead aprons) are worn cleanly inside imaging and fluoroscopy rooms.", guide: "Verify annual test certificate and storage racks for thyroid shields and lead armor sets." }
      ])
    },
    {
      id: "sec_ii_dom_3",
      number: "Domain 8",
      name: "Sterilization & Instrument Reprocessing",
      criteria: createCriteria("ii_dom3", [
        { text: "The hospital maintains a centralized sterile services department (CSSD) or dedicated autoclave area.", guide: "Verify centralized reprocessing. Avoid decentralized, individual pan boiling in outlying clinics." },
        { text: "All reusable surgical instruments are thoroughly pre-cleaned and scrubbed prior to disinfection.", guide: "Manual washing of blood and tissue remnants is essential. Autoclaves cannot sterilize baked-on biological debris." },
        { text: "Reprocessed surgical set packages incorporate physical, internal chemical indicator strips.", guide: "Review opened packs in general theater or delivery wards. Confirm standard chemical color changes are verified." },
        { text: "Mechanical autoclave parameters (temperature, pressure, duration) are recorded for every cycle.", guide: "Review written sterilizer logs. Verify temperatures reach 121°C for 30 min or 134°C for 4 min." },
        { text: "Biological indicators (Spore tests - Geobacillus stearothermophilus) are utilized at least weekly.", guide: "Review biological test logs and incubator readings validating absolute microbiological destruction." },
        { text: "Surgical packs are wrapped in proper double-layer sterile medical packaging paper or linen.", guide: "Confirm wrap types. Newspaper or flimsy standard papers cannot maintain sterile barriers." },
        { text: "Sterile instrument packages are clearly stamped with sterilization date, cycle number, and expiration date.", guide: "Inspect storage cupboards. Outdated or unstamped packs must be pulled back for reprocessing." },
        { text: "The sterile storage unit is clean, dust-free, and kept strictly separate from the decontamination field.", guide: "Enforce one-way flow. Critical sterile packs must stay in dry, enclosed cupboards, off the floor, away from wet sinks." },
        { text: "Transport of soiled instruments to CSSD utilizes locked, puncture-resistant, labeled containers.", guide: "Do not transport dirty bloody blades and kidney dishes openly in hands. Use closed orange/red plastic bins." },
        { text: "Enzymatic cleaning detergents are preferred for scrubbing micro-surgical instruments.", guide: "Confirm availability of multienzymated cleaning chemicals to dissolve stubborn blood proteins." },
        { text: "Sterilizer operators have received certified training on boiler management and chemical loading.", guide: "Verify occupational competency records or safety certificates of CSSD technicians." },
        { text: "Preventative technical maintenance for high-pressure autoclaves is performed quarterly.", guide: "Review equipment services records, gasket seal inspections, and safety pressure valve checks." },
        { text: "A clear physical separation exists in CSSD between 'Dirty', 'Clean Preparation', and 'Sterile Storage'.", guide: "CSSD architecture must follow a strict one-way movement path without back-flow of dirty staff to clean zones." },
        { text: "All endoscopes undergo high-level disinfection with verified active Gluteraldehyde or Ortho-phthalaldehyde (OPA).", guide: "Verify concentration check logs and cleaning timers for flexible scopes (minimum 12-20 minute immersion)." },
        { text: "Cold chemical sterilization immersion bins are covered with airtight, heavy plastic lids.", guide: "Prevent inhalation of neurotoxic chemical fumes (Gluteraldehyde) by using tightly sealed container chambers." },
        { text: "Sterilized packages are checked for moisture or water stains before ward distribution.", guide: "Wet packs are considered contaminated because moisture acts as a transport path for bacteria. Wet packs must be rejected." },
        { text: "Reprocessors use specialized soft brushes to carefully clean hollow cannulas and laryngeal tubes.", guide: "Verify availability of spiral thin brushes or lumen flushing syringes to remove nested inside fluids." },
        { text: "Automatic ultrasonic cleaner units are operated for processing complex jointed bone tools.", guide: "Check that orthopedic clamps and drills undergo ultrasonic cavitation to dislodge marrow tissue." },
        { text: "Sterile storage areas maintain controlled humidity (<60%) and temperature parameters (<24°C).", guide: "Moist heat damages packaging paper and paper fibers. Store logs must confirm climate control." },
        { text: "The hospital maintains backup vertical steam sterilizers for times of central system shutdowns.", guide: "Ensure secondary autoclaves are functional, safety-valved, and regularly tested in emergency shifts." },
        { text: "Clinical SOPs define the safe discard of surgical instruments that fail sterilization tests.", guide: "Ensure standard processes are in place to isolate, record, and re-autoclave sets showing failed indicator change." }
      ])
    },
    {
      id: "sec_ii_dom_4",
      number: "Domain 9",
      name: "Environmental Sanitation & Ward Hygiene",
      criteria: createCriteria("ii_dom9", [
        { text: "High-touch ward surfaces (bed rails, tables, monitors) are disinfected at least twice daily.", guide: "Observe ward cleaning logs. Verify sanitation records are signed near clinical nursing desks." },
        { text: "Cleaning staff utilize the 'two-bucket' or 'three-bucket' wash system for floors.", guide: "Do not rinse dirty mops in the clean disinfectant bucket. Mops must be loaded in rinsing water first." },
        { text: "Cleaners follow a cleaning direction of 'cleanest areas first, dirtiest areas last'.", guide: "Clean offices and general waiting halls first, and clean infectious isolation, bathrooms and toilets last." },
        { text: "Damp dusting techniques are utilized exclusively; dry sweeping of floors is prohibited.", guide: "Dry sweeping stirs up dusts containing MRSA and fungal spores into the breathing zone. Use damp mops and wipes." },
        { text: "Mop heads are color-coded indicating division (e.g., Red for toilets, Blue for patient wards).", guide: "Verify mop heads are segregated. Toilets mops must never be dragged into surgical preparations rooms." },
        { text: "Concentrated chlorine solutions are prepared fresh daily and stored in opaque, covered plastic jugs.", guide: "Chlorine degrades rapidly when exposed to sun heat and ambient air. Check mixing dates and closed storage labels." },
        { text: "All patient discharge beds undergo a formal terminal cleaning and disinfection process.", guide: "After patient discharge, the entire bed, frame, mattress, locker, and surrounding walls must be sanitized." },
         { text: "Patient mattresses have seamless, waterproof, tear-free polyurethane hazard skins.", guide: "Mattresses must not leak internal fluids. Cracked or torn covers accumulate deep infectious blood pools." },
        { text: "Spill kits for blood or bodily fluids are available and complete in emergency wards.", guide: "Verify spill kits have chlorine powder, thick gloves, scooper, biohazard tags, goggles, and absorbent pads." },
        { text: "Mops are laundered, chemically disinfected with chlorine, and hung dry daily off the floor.", guide: "Wet, dirty mops left sitting on floors become rich breeding grounds for Gram-negative organisms." },
        { text: "Cleaning staff wear personal protective equipment (heavy gloves, apron, boots) during all duties.", guide: "Ensure total compliance of janitorial teams. Safety checks must prevent bare-hands mop wringings." },
        { text: "Sinks, washbasins, and toilet bowls are descaled and disinfected at least once daily.", guide: "Check state of restroom fixtures. Verify absence of yellow scaling, active odors, and clogged sewers." },
        { text: "Chemical sanitizer concentrates are kept locked away in primary labeled storage chambers.", guide: "Ensure housekeeping concentrates are out of reach of children, psychiatric patients, and visitors." },
        { text: "Blood spill containment SOPs dictate a 10-minute wait duration for chlorine spray actions.", guide: "Let chlorine act on blood spills. Do not spray and wipe immediately; contact duration is required to deactivate viruses." },
        { text: "The emergency department has specialized drains for safe disposal of clinical rinse liquid.", guide: "Ensure cleaning fluids, blood washes, and liquid chemical residues are disposed in specialized utility sluice sinks." },
        { text: "Operating theater rooms undergo a thorough 'between-case' cleaning sequence.", guide: "After each operation, surgical tables, lights, and floor fields must be disinfected prior to the next admission." },
        { text: "General hospital corridors are kept entirely free of broken furniture and obsolete equipment.", guide: "Prevent clutter which harbors dirt, rodents, and vermin and interferes with quick vector cleanings." },
        { text: "A routine vector-control protocol manages pest, flies, and rodent risks quarterly.", guide: "Verify insect-screen doors are intact. Review external spraying or baits logs matching municipal rules." },
        { text: "Clean water basins are fitted with active mesh strainers to catch hair and debris.", guide: "Check that sink drains are unblocked and clear. Retained standing pool water breeds deep biofilm layers." },
        { text: "Clinical wall panelings have smooth, easily cleanable, scratch-resistant protective guards.", guide: "Verify wall finishes. Ensure zero peeling paints or porous wood panelings are adjacent to patient beds." },
        { text: "Janitorial supervisors actively inspect and sign off daily cleaning checklists across all floors.", guide: "Review janitorial logsheets. Verify active inspection records proving supervisors confirm quality on-site." }
      ])
    },
    {
      id: "sec_ii_dom_5",
      number: "Domain 10",
      name: "Healthcare Waste Management & Disposal",
      criteria: createCriteria("ii_dom10", [
        { text: "The hospital segregates medical waste at source matching national color codes.", guide: "Biohazardous waste in Yellow, Recyclable/Drug waste in Red, Domestic waste in Black bags." },
        { text: "Color-coded waste bins are placed within direct reaching distance of the clinical counter (< 1m).", guide: "Staff should not walk across corridors to discard contaminated items. Bins must stay immediately at points of care." },
        { text: "Yellow biohazard bins are labeled with international biohazard logos in local languages.", guide: "Verify warning tags. Warning signs prevent staff and patients from mistaking biohazard bins as waste paper baskets." },
        { text: "Rigid plastic safety boxes are used for containing dirty needles and surgical lancets.", guide: "Sharps must go directly into puncture-resistant safety boxes. Sharp boxes must never be topped into bags." },
        { text: "Safety boxes are closed and locked when filled to exactly three-quarters (75%) of their capacity.", guide: "Prohibit overfilling of sharp boxes. Overfilled safety boxes present needle-stick protrusion hazards." },
        { text: "Primary waste handlers wear thick industrial gloves, safety goggles, and heavy boots.", guide: "Ensure janitorial transport staff have protective equipment against needle pricks and trash splatters." },
        { text: "Internal waste transport utilizes dedicated, closed, wheeled carts labeled 'Infectious Waste'.", guide: "Do not carry open trash bags over shoulders. Carts must be leak-proof, smooth, and easily disinfected." },
        { text: "The hospital possesses a functional high-temperature incinerator with adequate chimney height.", guide: "Verify incinerator is operational (ideally dual-chamber, >850°C) with no visible emissions in general wards." },
        { text: "SOPs are established for the safe temporary storage of medical waste (< 24 hours on site).", guide: "Waste storage area must be secured, locked to prevent access by animals/unauthorized people, and ventilated." },
        { text: "Ash residues from burned medical waste are buried inside a secure, concrete-lined ash pit.", guide: "Ash residues have toxic heavy metals. Verify ash pits are fenced, covered, and prevent groundwater leaching." },
        { text: "Anatomical waste (placents, tissues) is disposed of inside a sanitary, dedicated placenta pit.", guide: "Verify placenta pit design has sealed concrete slabs, tight lids, and is physically separate from public zones." },
        { text: "Unused, expired liquid pharmaceuticals are chemically deactivated before sewer releasing.", guide: "Review records of medication disposal. Liquid meds must undergo neutralization or return to pharmaceutical depots." },
        { text: "Waste segregation audits are conducted weekly and shared with department leaders.", guide: "Audit trash contents. Yellow bags must not retain soda bottles; black bags must not retain bloody gauze." },
        { text: "The medical waste site is fenced, locked, and prominently shows caution signage.", guide: "Fencing prevents children, scavengers, and roaming cattle from accessing contaminated medical debris piles." },
        { text: "A dedicated cleaning station is designated strictly for disinfecting waste transport carts.", guide: "Carts must be washed after every shift. Clean up water must discharge to correct wastewater sinks." },
        { text: "Plastics (syringes without needles) undergo chemical sterilization if planned for recycling.", guide: "Verify safety protocols, shredding mechanics, and chlorine bath logs prior to plastic releases." },
        { text: "All safety box transport processes undergo dual check-off logs signed by ward nurse and trash staff.", guide: "Verify chain of custody reports showing complete counts of safety boxes coming from clinics to incinerators." },
        { text: "Incinerator exhaust layouts prevent fumes from flowing into surrounding maternity or pediatric wards.", guide: "Ensure stack output rises above surrounding rooflines and air currents direct smoke away from windows." },
        { text: "Puncture audits indicate zero needle-pricks inside general cleaning teams over last quarter.", guide: "Confirm occupational health registry has no untreated trash handler needle exposure events." },
        { text: "Medical centers operate waste autoclaves as secondary treatment options for biohazards.", guide: "Ensure backup waste sterilization tools exist in the event of incinerator mechanical breakdowns." },
        { text: "Education posters detailing binary color segregation rules are visible directly above trash cans.", guide: "Review bin areas. Visual aids must show lists of acceptable objects (gauzes vs papers) per color coding." }
      ])
    }
  ]
};

// All domains list helper
export const allDomains = [...sectionI.domains, ...sectionII.domains];

// Pre-packaged criteria lookup by ID
export const criteriaLookup = new Map<string, { criterion: Criterion; domain: Domain; section: Section }>();
[sectionI, sectionII].forEach(sec => {
  sec.domains.forEach(dom => {
    dom.criteria.forEach(crit => {
      criteriaLookup.set(crit.id, { criterion: crit, domain: dom, section: sec });
    });
  });
});

export const ALL_CRITERIA_IDS = Array.from(criteriaLookup.keys());

// Score Levels mapping
export const scoreLevels = [
  { min: 80, label: "Excellent (A-Grade)", color: "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100", bg: "bg-emerald-600" },
  { min: 60, label: "Compliance (B-Grade)", color: "text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100", bg: "bg-blue-600" },
  { min: 40, label: "Partial (C-Grade)", color: "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100", bg: "bg-amber-600" },
  { min: 0, label: "Inadequate (D-Grade)", color: "text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100", bg: "bg-rose-600" }
];

export function getScoreLevel(pct: number) {
  const rounded = Math.round(pct);
  for (const lvl of scoreLevels) {
    if (rounded >= lvl.min) return lvl;
  }
  return scoreLevels[scoreLevels.length - 1];
}

/**
 * High-precision calculator for scoring.
 * Since each IPC FLAT question is either YES, NO, or N/A:
 * Yes gives 1 point.
 * No gives 0 points.
 * N/A is skipped entirely and subtracted from the denominator.
 */
export function calculateDomainScore(domain: Domain, data: AssessmentData) {
  let yesCount = 0;
  let noCount = 0;
  let naCount = 0;

  domain.criteria.forEach(crit => {
    const entry = data[crit.id];
    if (entry) {
      if (entry.answer === 'yes') yesCount++;
      else if (entry.answer === 'no') noCount++;
      else if (entry.answer === 'na') naCount++;
    }
  });

  const applicable = yesCount + noCount;
  const percentage = applicable > 0 ? (yesCount / applicable) * 100 : 0;

  return {
    yesCount,
    noCount,
    naCount,
    applicable,
    percentage: Math.round(percentage * 10) / 10
  };
}

export function calculateSectionScore(section: Section, data: AssessmentData) {
  let totalYes = 0;
  let totalNo = 0;
  let totalNA = 0;

  section.domains.forEach(dom => {
    const s = calculateDomainScore(dom, data);
    totalYes += s.yesCount;
    totalNo += s.noCount;
    totalNA += s.naCount;
  });

  const applicable = totalYes + totalNo;
  const percentage = applicable > 0 ? (totalYes / applicable) * 100 : 0;

  return {
    totalYes,
    totalNo,
    totalNA,
    applicable,
    percentage: Math.round(percentage * 10) / 10
  };
}

export function initializeEmptyAssessmentData(): AssessmentData {
  const data: AssessmentData = {};
  ALL_CRITERIA_IDS.forEach(id => {
    data[id] = {
      answer: '',
      comment: ''
    };
  });
  return data;
}

export function getInitialHospitalInfo(): HospitalInfo {
  return {
    hospitalName: "",
    location: "",
    ceoName: "",
    ceoPhone: "",
    ceoEmail: "",
    medicalDirector: "",
    mdPhone: "",
    mdEmail: "",
    ipcLeader: "",
    ipcPhone: "",
    assessmentDate: new Date().toISOString().split("T")[0],
    previousAssessmentDate: "",
    totalHealthProfessionals: "",
    totalSupportStaff: "",
    totalBeds: "",
    assessorNames: ""
  };
}
