
function mergePhone(codeId,numberId){
 const c=document.getElementById(codeId);
 const n=document.getElementById(numberId);
 if(!c||!n) return "";
 const code=c.value||"";
 const num=n.value||"";
 if(!code) return num;
 if(!num) return code;
 return code+" "+num;
}

// ===== Add/Remove block support for Add More sections =====
function addRemoveButton(blockEl, containerEl, blockSelector, minBlocks = 1) {
  if (blockEl.querySelector(".remove-block-btn")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "remove-block-btn";
  btn.textContent = "Remove";

  btn.addEventListener("click", () => {
    const blocks = containerEl.querySelectorAll(blockSelector);
    if (blocks.length <= minBlocks) {
      alert("At least one entry is required.");
      return;
    }
    blockEl.remove();
  });

  blockEl.appendChild(btn);
}


function syncRequiredAsterisks(scopeEl = document) {
  const fields = scopeEl.querySelectorAll('input, select, textarea');
  fields.forEach(field => {
    const label = field.previousElementSibling && field.previousElementSibling.tagName === 'LABEL'
      ? field.previousElementSibling
      : null;
    if (!label) return;

    if (field.offsetParent === null) return;

    const hasStar = /\*\s*$/.test(label.textContent.trim());
    if (field.required) {
      if (!hasStar) label.textContent = label.textContent.trim() + ' *';
    } else {
      if (hasStar) label.textContent = label.textContent.replace(/\s*\*\s*$/, '');
    }
  });
}

function initRemoveButtons() {
  // ✅ UPDATED: container IDs matched with current HTML
  const setups = [
    { container: "employmentSection", block: ".employment-block" },
    { container: "eduSection",        block: ".edu-block" },
    { container: "certSection",       block: ".cert-block" },
    { container: "familySection",     block: ".family-block" },
    { container: "emergencySection",  block: ".emergency-block" }
  ];

  setups.forEach(s => {
    const c = document.getElementById(s.container);
    if (!c) return;

    const blocks = c.querySelectorAll(s.block);
    blocks.forEach((b, i) => {
      // One block is must: do not add remove button to the first block
      if (i === 0) return;
      addRemoveButton(b, c, s.block, 1);
    });
  });

  try { syncRequiredAsterisks(document); } catch(e) {}
}




// ===== Numeric-only guards for phone & bank fields =====
function enforceNumericOnly(el) {
  el.value = el.value.replace(/[^0-9]/g, "");
}

function attachNumericGuards() {
  const selectors = [
    'input[name="mobileNumber"]',
    'input[name="telHome"]',
    'input[name="whatsappNo"]',
    'input[name="bankAccountNumber"]'
  ];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach(input => {
      input.addEventListener("input", () => enforceNumericOnly(input));
      input.addEventListener("paste", () => {
        setTimeout(() => enforceNumericOnly(input), 0);
      });
    });
  });
}


// 🔐 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDhHLzmytXfRB6Xd92Bl9AoRhmDOWTJ1qY",
  authDomain: "employment-form-login.firebaseapp.com",
  projectId: "employment-form-login",
  storageBucket: "employment-form-login.firebasestorage.app",
  messagingSenderId: "784854094144",
  appId: "1:784854094144:web:5ec3f9a5120717f806eaa5",
  measurementId: "G-MYBD4VRD2M"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();


// ===== Excel-safe input guards (prevents formula injection) =====
function sanitizeExcelValue(raw) {
  if (raw === null || raw === undefined) return raw;
  const s = String(raw);
  // If the first non-space char is one of these, Excel may treat it as a formula in exports
  // Common protection list: = + - @
  if (/^\s*[=+\-@]/.test(s)) {
    return "'" + s; // prefix apostrophe to force literal text in Excel
  }
  return s;
}

// For textarea/text fields: ensure first non-space character starts with A-Z / a-z / 0-9.
// If it starts with special chars, strip them (keeps the rest). Also neutralize Excel formula chars.
function enforceSafeLeadingChars(el) {
  if (!el || typeof el.value !== "string") return;

  let v = el.value;

  // Remove leading whitespace for the "first character" rule (internal spaces remain)
  v = v.replace(/^\s+/, "");

  // Strip leading non-alphanumeric characters
  v = v.replace(/^[^A-Za-z0-9]+/, "");

  // Neutralize Excel-formula leading chars (if still present)
  v = sanitizeExcelValue(v);

  el.value = v;
}

function attachExcelSafeGuards() {
  // Textareas: apply strict rule
  document.querySelectorAll("textarea").forEach((ta) => {
    ta.addEventListener("blur", () => enforceSafeLeadingChars(ta));
  });

  // Generic text inputs: apply (skip special types like email/tel/date/number by targeting type="text")
  document.querySelectorAll('input[type="text"]').forEach((inp) => {
    // If any field must allow special leading chars, add its name into this set.
    const skipNames = new Set([]);
    if (skipNames.has(inp.name)) return;

    inp.addEventListener("blur", () => {
      if (inp.value && inp.value.trim().length > 0) enforceSafeLeadingChars(inp);
    });
  });
}



function applyCitizenshipMalaysiaRules() {
  const currentEl = document.getElementById('currentlyInMalaysia');
  const citizenshipEl = document.getElementById('citizenship');

  const isInMY = currentEl && (currentEl.value === 'Yes');
  const citizenship = (citizenshipEl && citizenshipEl.value ? citizenshipEl.value : '').trim();
  const isMalaysian = citizenship.toLowerCase() === 'malaysia';
  const isOther = citizenship.toLowerCase() === 'other';

  // Helper: show/hide input AND its previous label
  const setFieldVisible = (el, visible) => {
    if (!el) return;
    const label = el.previousElementSibling && el.previousElementSibling.tagName === "LABEL"
      ? el.previousElementSibling
      : null;
    if (label) label.style.display = visible ? "" : "none";
    el.style.display = visible ? "" : "none";
  };

  const clearIfHidden = (el, visible) => {
    if (!el) return;
    if (!visible) {
      if (el.tagName === "SELECT") el.value = "";
      else el.value = "";
    }
  };

  // Sections/fields
  const homeAddr = document.querySelector('[name="homeCountryAddress"]');
  const yearsHome = document.getElementById('yearsOfStayHome') || document.querySelector('[name="yearsOfStayHome"]');

  const addrMY = document.getElementById('completeAddressMalaysia');
  const yearsMY = document.getElementById('yearsOfStayMalaysia');
  const fromMY  = document.getElementById('durationStayFrom') || document.querySelector('[name="durationStayFrom"]');
  const toMY    = document.getElementById('durationStayTo') || document.querySelector('[name="durationStayTo"]');

  const icNumber = document.getElementById('icNumber');
  const icPlace  = document.querySelector('[name="icPlaceOfIssue"]');
  const icIssue  = document.querySelector('[name="icDateOfIssue"]');
  const icExpiry = document.querySelector('[name="icDateOfExpiry"]');

  const primaryPassport = document.getElementById('primaryPassport');
  const passportPlace   = document.querySelector('[name="passportPlaceOfIssue"]');
  const passportIssue   = document.querySelector('[name="passportDateOfIssue"]');
  const passportExpiry  = document.querySelector('[name="passportDateOfExpiry"]');

  // Citizenship "Other" div
  const otherDiv = document.getElementById('citizenshipOtherDiv');
  if (otherDiv) otherDiv.style.display = isOther ? "" : "none";

  // Always collect passport for everyone (required + visible)
  [primaryPassport, passportPlace, passportIssue, passportExpiry].forEach(el => setFieldVisible(el, true));
  if (primaryPassport) primaryPassport.required = true;
  if (passportPlace) passportPlace.required = true;
  if (passportIssue) passportIssue.required = true;
  if (passportExpiry) passportExpiry.required = true;

  // IC only for Malaysians (required when visible)
  [icNumber, icPlace, icIssue, icExpiry].forEach(el => setFieldVisible(el, isMalaysian));
  if (icNumber) icNumber.required = isMalaysian;
  if (icPlace)  icPlace.required  = isMalaysian;
  if (icIssue)  icIssue.required  = isMalaysian;
  if (icExpiry) icExpiry.required = isMalaysian;

  // Country of Citizenship Address + Years (always visible & required)
  setFieldVisible(homeAddr, true);
  setFieldVisible(yearsHome, true);
  if (homeAddr) homeAddr.required = true;
  if (yearsHome) yearsHome.required = true;

  // Malaysia address: show ONLY when currently in Malaysia AND not Malaysian citizen
  const showAddrMY = !!isInMY && !isMalaysian;
  setFieldVisible(addrMY, showAddrMY);
  clearIfHidden(addrMY, showAddrMY);

  // Malaysia stay fields:
  // - If in MY: show Start+End for ALL
  // - If not in MY: show Start+End ONLY for Malaysian citizens
  const showMYStay = !!isInMY || (!!isMalaysian && !isInMY);

  // Years in Malaysia is redundant when (In MY = Yes AND Citizenship = Malaysia)
  const showYearsMY = showMYStay && !(isInMY && isMalaysian);

  // Apply visibility
  setFieldVisible(yearsMY, showYearsMY);
  [fromMY, toMY].forEach(el => setFieldVisible(el, showMYStay));

  // Clear if hidden
  clearIfHidden(yearsMY, showYearsMY);
  [fromMY, toMY].forEach(el => clearIfHidden(el, showMYStay));

  // Required rules
  if (yearsMY) yearsMY.required = !!showYearsMY;

  // End date in MY is optional (do not force required)
  if (toMY) toMY.required = false;

  // Clear IC fields if not Malaysian
  if (!isMalaysian) {
    [icNumber, icPlace, icIssue, icExpiry].forEach(el => clearIfHidden(el, false));
  }

  // Note: YearsOfStayHome always required; do not clear.

  try { syncRequiredAsterisks(document); } catch(e) {}
}


// Keep existing onchange hooks
function toggleMalaysiaFields(){ applyCitizenshipMalaysiaRules(); }
function toggleCitizenshipFields(){ applyCitizenshipMalaysiaRules(); }

document.addEventListener('DOMContentLoaded', () => {
  attachNumericGuards();
  initRemoveButtons();
  attachExcelSafeGuards();
  const loginSection = document.getElementById('loginSection');
  const formWrapper = document.getElementById('formWrapper');

  auth.onAuthStateChanged(user => {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';

    if (user) {
      loginSection.style.display = 'none';
      formWrapper.style.display = 'block';
      showSection(currentSection);
      toggleMalaysiaFields();
      toggleCitizenshipFields();
      localStorage.setItem("userEmail", user.email);
    } else {
      loginSection.style.display = 'block';
      formWrapper.style.display = 'none';
      localStorage.removeItem("userEmail");
    }
  });

  document.getElementById('loginBtn').addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).then(result => {
      const user = result.user;
      if (user) {
        loginSection.style.display = 'none';
        formWrapper.style.display = 'block';
        showSection(currentSection);
        toggleMalaysiaFields();
        toggleCitizenshipFields();
        localStorage.setItem("userEmail", user.email);
      }
    }).catch(error => {
      alert("Login failed: " + error.message);
    });
  });

  // These lines from your bottom block:
  showSection(currentSection);
  toggleMalaysiaFields();
  toggleCitizenshipFields();
});

// script.js

let currentSection = 0;
const sections = document.querySelectorAll('.form-section');

function showSection(index) {
  sections.forEach((section, i) => {
    section.classList.toggle('active', i === index);
  });
  updateProgressBar(index);
  try { syncRequiredAsterisks(sections[index]); } catch(e) {}
}

function updateProgressBar(index) {
  const progress = document.getElementById('progress');
  const percent = ((index + 1) / sections.length) * 100;
  progress.style.width = percent + '%';
}

function nextSection() {
  if (!validateSection(currentSection)) return;
  if (currentSection < sections.length - 1) {
    currentSection++;
    showSection(currentSection);
  }
}

function prevSection() {
  if (currentSection > 0) {
    currentSection--;
    showSection(currentSection);
  }
}

function validateSection(index) {
  const section = sections[index];
  const requiredFields = section.querySelectorAll('[required]');
  const optionalEmails = section.querySelectorAll('input[type="email"]:not([required])');
  let isValid = true;

  // First: validate all required fields
  for (const field of requiredFields) {
    if (field.offsetParent === null) continue;

    if (!field.checkValidity()) {
      field.classList.add('error-highlight');
      alert(field.validationMessage);
      field.focus();
      isValid = false;
      return false;
    } else {
      field.classList.remove('error-highlight');
    }
  }

  // Second: validate optional email fields (if filled)
  for (const field of optionalEmails) {
    if (field.offsetParent === null) continue;
    const value = field.value.trim();

    if (value !== '' && !field.checkValidity()) {
      field.classList.add('error-highlight');
      alert('Please enter a valid email address.');
      field.focus();
      isValid = false;
      return false;
    } else {
      field.classList.remove('error-highlight');
    }
  }

  return isValid;
}


function toggleOtherField(selectElement, targetDivId) {
  const div = document.getElementById(targetDivId);
  if (!div) return;
  const input = div.querySelector('input');

  if (selectElement.value === 'Other') {
    div.style.display = 'block';
    if (input) input.required = true;
  } else {
    div.style.display = 'none';
    if (input) {
      input.required = false;
      input.value = '';
    }
  }

  try { syncRequiredAsterisks(document); } catch(e) {}
}




function toggleMarriedFields(selectElem) {
  const marriedDiv = document.getElementById('marriedFields');
  const marriageDateField = document.getElementById('marriageDate');
  const kidsCountField = document.getElementById('numberOfKids');

  if (selectElem.value === 'Married') {
    marriedDiv.style.display = 'block';
    marriageDateField.required = true;
    kidsCountField.required = true;
  } else {
    marriedDiv.style.display = 'none';
    marriageDateField.required = false;
    kidsCountField.required = false;
    marriageDateField.value = '';
    kidsCountField.value = '';
  }

  try { syncRequiredAsterisks(document); } catch(e) {}
}



function addEmployment() {
  const container = document.getElementById('employmentSection');
  const firstBlock = container.querySelector('.employment-block');
  if (!firstBlock) return;

  const clone = firstBlock.cloneNode(true);

  // Clear values
  clone.querySelectorAll('input, textarea').forEach(input => input.value = '');

  // Safety: remove existing remove button if any got cloned
  clone.querySelectorAll('.remove-block-btn').forEach(btn => btn.remove());

  container.appendChild(clone);

  // Add remove option to newly added block (min 1 required)
  addRemoveButton(clone, container, ".employment-block", 1);

  try { syncRequiredAsterisks(document); } catch(e) {}
}


function addEducation() {
  const container = document.getElementById('eduSection');
  const firstBlock = container.querySelector('.edu-block');
  if (!firstBlock) return;

  const clone = firstBlock.cloneNode(true);

  clone.querySelectorAll('input, select').forEach(el => {
    el.value = '';
    if (el.tagName === 'SELECT') el.selectedIndex = 0;
  });

  clone.querySelectorAll('.remove-block-btn').forEach(btn => btn.remove());

  container.appendChild(clone);
  try { bindGraduationYearToggles(); } catch(e) {}

  addRemoveButton(clone, container, ".edu-block", 1);

  try { syncRequiredAsterisks(document); } catch(e) {}
}


function addFamily() {
  const container = document.getElementById('familySection');
  const firstBlock = container.querySelector('.family-block');
  if (!firstBlock) return;

  const clone = firstBlock.cloneNode(true);

  clone.querySelectorAll('input, select').forEach(el => {
    el.value = '';
    if (el.tagName === 'SELECT') el.selectedIndex = 0;
  });

  clone.querySelectorAll('.remove-block-btn').forEach(btn => btn.remove());

  container.appendChild(clone);

  addRemoveButton(clone, container, ".family-block", 1);

  try { syncRequiredAsterisks(document); } catch(e) {}
}


function addCertification() {
  const container = document.getElementById('certSection');
  const firstBlock = container.querySelector('.cert-block');
  if (!firstBlock) return;

  const clone = firstBlock.cloneNode(true);

  clone.querySelectorAll('input').forEach(input => input.value = '');

  clone.querySelectorAll('.remove-block-btn').forEach(btn => btn.remove());

  container.appendChild(clone);

  addRemoveButton(clone, container, ".cert-block", 1);

  try { syncRequiredAsterisks(document); } catch(e) {}
}

function extractGroup(selector, fields) {
  const blocks = document.querySelectorAll(selector);
  const data = [];

  blocks.forEach(block => {
    const group = {};
    fields.forEach(field => {
      const input = block.querySelector(`[name="${field}[]"]`);
      group[field] = input ? input.value : "";
    });
    data.push(group);
  });

  return data;
}

let isSubmitting = false;

document.getElementById("multiStepForm").addEventListener("submit", function (e) {
  e.preventDefault();

  if (isSubmitting) return;
  isSubmitting = true;
  const submitBtn = document.querySelector('button[type="submit"]');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "Submitting..."; }
toggleMalaysiaFields();
  toggleCitizenshipFields();

  for (let i = 0; i < sections.length; i++) {
    if (!validateSection(i)) {
      currentSection = i;
      showSection(currentSection);
      return;
    }
  }

  const formData = {
    personalData: {
      positionApplied: document.querySelector('[name="positionApplied"]').value,
      positionOther1: document.querySelector('[name="positionOther1"]')?.value || "",
      joiningDate: document.querySelector('[name="joiningDate"]').value,
      fullName: document.querySelector('[name="fullName"]').value,
      dob: document.querySelector('[name="dob"]').value,
      age: document.querySelector('[name="age"]').value,
      stateOfBirth: document.querySelector('[name="stateOfBirth"]').value,
      maritalStatus: document.querySelector('[name="maritalStatus"]').value,
      marriageDate: document.querySelector('[name="marriageDate"]')?.value || "",
      numberOfKids: document.querySelector('[name="numberOfKids"]')?.value || "",
      gender: document.querySelector('[name="gender"]').value,
      currentlyInMalaysia: document.querySelector('[name="currentlyInMalaysia"]').value,
      citizenship: document.querySelector('[name="citizenship"]').value,
      citizenshipOther: document.querySelector('[name="citizenshipOther"]')?.value || "",
      race: document.querySelector('[name="race"]').value,
      religion: document.querySelector('[name="religion"]').value,
      homeCountryAddress: document.querySelector('[name="homeCountryAddress"]').value,
      yearsOfStayHome: document.querySelector('[name="yearsOfStayHome"]').value,
      completeAddressMalaysia: document.querySelector('[name="completeAddressMalaysia"]').value,
      yearsOfStayMalaysia: document.querySelector('[name="yearsOfStayMalaysia"]').value,
      durationStayFrom: document.querySelector('[name="durationStayFrom"]').value,
      durationStayTo: document.querySelector('[name="durationStayTo"]').value,
      icNumber: document.querySelector('[name="icNumber"]').value,
      icPlaceOfIssue: document.querySelector('[name="icPlaceOfIssue"]').value,
      icDateOfIssue: document.querySelector('[name="icDateOfIssue"]').value,
      icDateOfExpiry: document.querySelector('[name="icDateOfExpiry"]').value,
      primaryPassport: document.querySelector('[name="primaryPassport"]').value,
      passportPlaceOfIssue: document.querySelector('[name="passportPlaceOfIssue"]').value,
      passportDateOfIssue: document.querySelector('[name="passportDateOfIssue"]').value,
      passportDateOfExpiry: document.querySelector('[name="passportDateOfExpiry"]').value,
      visaCollectionCentre: document.querySelector('[name="visaCollectionCentre"]').value,
      mothersMaidenName: document.querySelector('[name="mothersMaidenName"]').value,
    },
    contactInfo: {
      email: document.querySelector('[name="email2"]').value,
      mobileCountryCode: document.querySelector('[name="mobileCountryCode"]')?.value || "",
      mobile: document.querySelector('[name="mobile2"]').value,
      telHome: document.querySelector('[name="telHome"]').value,
      whatsappCountryCode: document.querySelector('[name="whatsappCountryCode"]')?.value || "",
      whatsappNo: document.querySelector('[name="whatsappNo"]').value,
      linkedInId: document.querySelector('[name="linkedInId"]').value,
      facebook: document.querySelector('[name="facebook"]').value,
      jobLocation: document.querySelector('[name="joblocation"]').value
    },
    bankInfo: {
      bank: document.querySelector('[name="bank"]').value,
      bankOther: document.querySelector('[name="bankOther"]')?.value || "",
      bankAccount: document.querySelector('[name="bankAccount"]').value,
      accountType: document.querySelector('[name="accountType"]').value,
      taxNumber: document.querySelector('[name="taxNumber"]').value,
      epfNumber: document.querySelector('[name="epfNumber"]').value,
      epfRate: document.querySelector('[name="epfRate"]').value,
      socsoNumber: document.querySelector('[name="socsoNumber"]').value,
      majorSkillSet: document.querySelector('[name="majorSkillSet"]').value,
    },
    employment: extractGroup(".employment-block", ["company", "from", "to", "contactCountryCode", "contactNumber", "jobTitle", "officeAddress", "refName", "refPhoneCountryCode", "refPhone", "refPosition", "refEmail", "reasonForLeaving", "lastSalary"]),
    education: extractGroup(".edu-block", ["eduSchool", "eduInstitute", "eduYear", "eduGraduated", "eduDegree", "eduGPA", "eduStream"]),
    certifications: extractGroup(".cert-block", ["certInstitution", "certCompletionDate", "certCourseTitle", "certNumber"]),
    family: extractGroup(".family-block", ["familyName", "familyRelation", "familyPassport", "familyDOB", "familyOccupation"]),
    emergencyContacts: extractGroup(".emergency-block", ["emergencyName", "emergencyRelation", "emergencyPhoneCountryCode", "emergencyPhone", "emergencyAddress", "emergencyLocation"]),
    emergencyContact: (() => { const arr = extractGroup(".emergency-block", ["emergencyName", "emergencyRelation", "emergencyPhoneCountryCode", "emergencyPhone", "emergencyAddress", "emergencyLocation"]); const first = arr && arr[0] ? arr[0] : {}; return { name: first.emergencyName || "", relation: first.emergencyRelation || "", phone: ((first.emergencyPhoneCountryCode||"") + " " + (first.emergencyPhone||"")).trim(), address: first.emergencyAddress || "", location: first.emergencyLocation || "" }; })()
  };
// ✅ Add this line here:
  formData.authenticatedEmail = localStorage.getItem("userEmail");
  
  const flowUrl = "https://default801bb2d2c6584e6787728a97c96f3e.e2.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/7003fbb3a2f8436789a6895468c71bf1/triggers/manual/paths/invoke/?api-version=1&tenantId=tId&environmentName=Default-801bb2d2-c658-4e67-8772-8a97c96f3ee2&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=gSF_hOIn6LCfJXa9tfr5z8WrhbH05fq4nay_GBH7LBc"; // Replace with actual Power Automate endpoint

  fetch(flowUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(formData)
})
  .then(res => {
    if (res.ok) {
      // ✅ Redirect after successful submission
      window.location.href = "thank-you.html"; // Change this if hosted differently
    } else {
      alert("❌ Submission failed. Please try again.");
    }
  })

    .catch(err => {
      console.error("⚠️ Submission error:", err);
      alert("⚠️ Submission error: " + err.message);
    })
  .finally(() => {
    isSubmitting = false;
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "Submit"; }
  });
});
function addEmergencyContact() {
  const container = document.getElementById('emergencySection');
  const firstBlock = container.querySelector('.emergency-block');
  if (!firstBlock) return;

  const clone = firstBlock.cloneNode(true);

  clone.querySelectorAll('input, textarea, select').forEach(el => {
    if (el.tagName === 'SELECT') el.selectedIndex = 0;
    else el.value = '';
  });

  clone.querySelectorAll('.remove-block-btn').forEach(btn => btn.remove());

  container.appendChild(clone);

  addRemoveButton(clone, container, ".emergency-block", 1);
}



function toggleGraduationYearForBlock(block) {
  if (!block) return;
  const gradSel = block.querySelector('[name="graduated[]"]');
  const yearInp = block.querySelector('[name="yearGraduated[]"]');
  if (!gradSel || !yearInp) return;

  const isYes = (gradSel.value || "").toLowerCase() === "yes";

  // show/hide label + input
  const label = yearInp.previousElementSibling && yearInp.previousElementSibling.tagName === "LABEL"
    ? yearInp.previousElementSibling
    : null;

  if (label) label.style.display = isYes ? "" : "none";
  yearInp.style.display = isYes ? "" : "none";

  yearInp.required = isYes;
  if (!isYes) yearInp.value = "";
}

function bindGraduationYearToggles() {
  document.querySelectorAll('.edu-block').forEach(block => {
    const gradSel = block.querySelector('[name="graduated[]"]');
    if (!gradSel) return;

    // initial
    toggleGraduationYearForBlock(block);

    // on change
    gradSel.addEventListener('change', () => toggleGraduationYearForBlock(block));
  });
}