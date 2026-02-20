
// ===== Add/Remove button for "Add More" blocks =====
function addRemoveButton(blockEl, containerEl, blockSelector, minBlocks = 1) {
  if (!blockEl || !containerEl) return;
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

function initRemoveButtons() {
  const setups = [
    { container: "employmentSection", block: ".employment-block" },
    { container: "eduSection", block: ".edu-block" },
    { container: "familySection", block: ".family-block" },
    { container: "certSection", block: ".cert-block" }
  ];

  setups.forEach((s) => {
    const c = document.getElementById(s.container);
    if (!c) return;
    const blocks = c.querySelectorAll(s.block);
    blocks.forEach((b, i) => {
      if (i === 0) return; // keep first block
      addRemoveButton(b, c, s.block, 1);
    });
  });
}



// ===== Numeric-only guards for phone & bank fields =====

function enforceNumericOnly(el) {
  el.value = el.value.replace(/[^0-9]/g, "");
}

function bindNumericGuard(input){
  if (!input || input.dataset.numericBound === "1") return;
  input.dataset.numericBound = "1";

  input.addEventListener("input", () => enforceNumericOnly(input));
  input.addEventListener("paste", () => setTimeout(() => enforceNumericOnly(input), 0));
}

/**
 * Attach numeric-only input guards.
 * Call with a specific root element (e.g., a newly cloned block) to bind listeners only inside it.
 */
function attachNumericGuards(root = document) {
  const selectors = [
    'input[name="mobile2"]',
    'input[name="telHome"]',
    'input[name="whatsappNo"]',
    'input[name="bankAccount"]'
  ];

  selectors.forEach((sel) => {
    root.querySelectorAll(sel).forEach((input) => bindNumericGuard(input));
  });
}



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

function bindExcelSafeGuard(el){
  if (!el || el.dataset.excelSafeBound === "1") return;
  el.dataset.excelSafeBound = "1";

  el.addEventListener("blur", () => enforceSafeLeadingChars(el));
}

/**
 * Attach Excel-safe guards for text inputs and textareas.
 * Call with a specific root element (e.g., a newly cloned block) to bind listeners only inside it.
 */
function attachExcelSafeGuards(root = document) {
  // Textareas: apply strict rule
  root.querySelectorAll("textarea").forEach((ta) => bindExcelSafeGuard(ta));

  // Text inputs: apply (skip special types like email/tel/date/number by targeting type="text")
  root.querySelectorAll('input[type="text"]').forEach((inp) => {
    // If any field must allow special leading chars, add its name into this set.
    const skipNames = new Set([]);
    if (skipNames.has(inp.name)) return;

    bindExcelSafeGuard(inp);
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

document.addEventListener('DOMContentLoaded', () => {
  attachExcelSafeGuards();
  attachNumericGuards();
  initRemoveButtons();
  const loginSection = document.getElementById('loginSection');
  const formWrapper = document.getElementById('formWrapper');

  auth.onAuthStateChanged(user => {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';

    if (user) {
      loginSection.style.display = 'none';
      formWrapper.style.display = 'flex';
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
        formWrapper.style.display = 'flex';
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
}

function toggleMalaysiaFields() {
  const isMalaysia = document.getElementById('currentlyInMalaysia').value === 'Yes';
  const addr = document.getElementById('completeAddressMalaysia');
  const years = document.getElementById('yearsOfStayMalaysia');

  if (addr) addr.required = isMalaysia;
  if (years) years.required = isMalaysia;

  if (!isMalaysia) {
    if (addr) addr.value = '';
    if (years) years.value = '';
  }
}

function toggleCitizenshipFields() {
  const citizenship = document.getElementById('citizenship').value;
  const citizenshipOtherDiv = document.getElementById('citizenshipOtherDiv');
  const icNumber = document.getElementById('icNumber');
  const icPlace = document.querySelector('[name="icPlaceOfIssue"]');
  const icIssue = document.querySelector('[name="icDateOfIssue"]');
  const icExpiry = document.querySelector('[name="icDateOfExpiry"]');
  const primaryPassport = document.getElementById('primaryPassport');
  const passportPlace = document.querySelector('[name="passportPlaceOfIssue"]');
  const passportIssue = document.querySelector('[name="passportDateOfIssue"]');
  const passportExpiry = document.querySelector('[name="passportDateOfExpiry"]');

  if (citizenship === 'Other') {
    if (citizenshipOtherDiv) citizenshipOtherDiv.style.display = 'block';
    if (primaryPassport) primaryPassport.required = true;
    if (passportPlace) passportPlace.required = true;
    if (passportIssue) passportIssue.required = true;
    if (passportExpiry) passportExpiry.required = true;

    if (icNumber) icNumber.required = false;
    if (icPlace) icPlace.required = false;
    if (icIssue) icIssue.required = false;
    if (icExpiry) icExpiry.required = false;
  } else {
    if (citizenshipOtherDiv) citizenshipOtherDiv.style.display = 'none';
    const input = citizenshipOtherDiv?.querySelector('input');
    if (input) input.value = '';

    if (citizenship === 'Malaysia') {
      if (icNumber) icNumber.required = true;
      if (icPlace) icPlace.required = true;
      if (icIssue) icIssue.required = true;
      if (icExpiry) icExpiry.required = true;

      if (primaryPassport) primaryPassport.required = false;
      if (passportPlace) passportPlace.required = false;
      if (passportIssue) passportIssue.required = false;
      if (passportExpiry) passportExpiry.required = false;
    } else {
      // Singaporean case or else
      if (primaryPassport) primaryPassport.required = true;
      if (passportPlace) passportPlace.required = true;
      if (passportIssue) passportIssue.required = true;
      if (passportExpiry) passportExpiry.required = true;
    }
  }
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
}


function addEmployment() {
  const container = document.getElementById('employmentSection');
  const firstBlock = container?.querySelector('.employment-block');
  if (!firstBlock) return;

  const clone = firstBlock.cloneNode(true);

  // clear values in cloned block
  clone.querySelectorAll('input, textarea, select').forEach(el => {
    if (el.tagName === 'SELECT') {
      el.selectedIndex = 0;
    } else {
      el.value = '';
    }
  });

  container.appendChild(clone);

  // Add a remove button to the new block (keep at least 1 block)
  addRemoveButton(clone, container, '.employment-block', 1);

  // Re-attach guards for the new inputs only
  attachNumericGuards(clone);
  attachExcelSafeGuards(clone);
}

function addEducation() {
  const container = document.getElementById('eduSection');
  const firstBlock = container?.querySelector('.edu-block');
  if (!firstBlock) return;

  const clone = firstBlock.cloneNode(true);

  // clear values in cloned block
  clone.querySelectorAll('input, textarea, select').forEach(el => {
    if (el.tagName === 'SELECT') {
      el.selectedIndex = 0;
    } else {
      el.value = '';
    }
  });

  container.appendChild(clone);

  // Add a remove button to the new block (keep at least 1 block)
  addRemoveButton(clone, container, '.edu-block', 1);

  // Re-attach guards for the new inputs only
  attachNumericGuards(clone);
  attachExcelSafeGuards(clone);
}

function addFamily() {
  const container = document.getElementById('familySection');
  const firstBlock = container?.querySelector('.family-block');
  if (!firstBlock) return;

  const clone = firstBlock.cloneNode(true);

  // clear values in cloned block
  clone.querySelectorAll('input, textarea, select').forEach(el => {
    if (el.tagName === 'SELECT') {
      el.selectedIndex = 0;
    } else {
      el.value = '';
    }
  });

  container.appendChild(clone);

  // Add a remove button to the new block (keep at least 1 block)
  addRemoveButton(clone, container, '.family-block', 1);

  // Re-attach guards for the new inputs only
  attachNumericGuards(clone);
  attachExcelSafeGuards(clone);
}

function addCertification() {
  const container = document.getElementById('certSection');
  const firstBlock = container?.querySelector('.cert-block');
  if (!firstBlock) return;

  const clone = firstBlock.cloneNode(true);

  // clear values in cloned block
  clone.querySelectorAll('input, textarea, select').forEach(el => {
    if (el.tagName === 'SELECT') {
      el.selectedIndex = 0;
    } else {
      el.value = '';
    }
  });

  container.appendChild(clone);

  // Add a remove button to the new block (keep at least 1 block)
  addRemoveButton(clone, container, '.cert-block', 1);

  // Re-attach guards for the new inputs only
  attachNumericGuards(clone);
  attachExcelSafeGuards(clone);
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

document.getElementById("multiStepForm").addEventListener("submit", function (e) {
  e.preventDefault();

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
      mobile: document.querySelector('[name="mobile2"]').value,
      telHome: document.querySelector('[name="telHome"]').value,
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
    employment: extractGroup(".employment-block", ["company", "from", "to", "employeeId", "contactNumber", "jobTitle", "officeAddress", "refName", "refPhone", "refPosition", "refEmail", "reasonForLeaving", "lastSalary"]),
    education: extractGroup(".edu-block", ["eduSchool", "eduInstitute", "eduYear", "eduGraduated", "eduDegree", "eduGPA", "eduStream"]),
    certifications: extractGroup(".cert-block", ["certInstitution", "certCompletionDate", "certCourseTitle", "certNumber"]),
    family: extractGroup(".family-block", ["familyName", "familyRelation", "familyPassport", "familyDOB", "familyOccupation"]),
    emergencyContact: {
      name: document.querySelector('[name="emergencyName"]').value,
      relation: document.querySelector('[name="emergencyRelation"]').value,
      phone: document.querySelector('[name="emergencyPhone"]').value,
      address: document.querySelector('[name="emergencyAddress"]').value,
      location: document.querySelector('[name="emergencyLocation"]').value,
    },
    officeUse: {
      costCenterCode: document.querySelector('[name="costCenterCode"]').value,
      costCenterName: document.querySelector('[name="costCenterName"]').value,
      actualJoiningDate: document.querySelector('[name="actualJoiningDate"]').value,
      category: document.querySelector('[name="category"]').value,
      department: document.querySelector('[name="department"]').value,
      project: document.querySelector('[name="project"]').value,
      positionApplied: document.querySelectorAll('[name="officePositionApplied"]')[1]?.value || '',
      officeUseDate: document.querySelector('[name="officeUseDate"]').value,
    }
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
    });
});
