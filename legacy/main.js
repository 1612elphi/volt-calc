const form = document.getElementById("calc-form");
const resultOutput = document.getElementById("result");

/* ------------------ */
/* Live calculation   */
/* ------------------ */

form.addEventListener("input", () => {
  recalculate();
});

// initial calculation
recalculate();

/* ------------------ */
/* Core logic         */
/* ------------------ */

function recalculate() {
  const data = getFormValues(form);

  /* ------------------ */
  /* Bedarfswerte       */
  /* ------------------ */

  const GRUNDBETRAG = 1126;
  const FAMILY_FACTOR = 395;

  const rentTable = {
    1: 511,
    2: 619,
    3: 737,
    4: 858,
    5: 982,
    6: 1101,
  };

  // sliders (range inputs must have name attributes!)
  const familySize = data.family_slider;
  const rentLevel = data.rent_slider;

  const familyAmount = FAMILY_FACTOR * familySize;
  const rentAmount = rentTable[rentLevel] || 0;
  const rent20 = Math.floor(rentAmount * 1.2);

  // update disabled fields
  document.getElementById("family_amount").value = formatNumber(familyAmount);
  document.getElementById("rent_amount").value = formatNumber(rent20);

  // update slider number badges
  document.getElementById("family_slider_value").textContent = familySize;
  document.getElementById("rent_slider_value").textContent = rentLevel;

  const ekg1 = GRUNDBETRAG + familyAmount + rent20;
  document.getElementById("ekg1").value = formatNumber(ekg1);

  const ekg3 = ekg1 * 1.2 + data.special_burdon;
  document.getElementById("ekg3").value = formatNumber(ekg3);

  const ekg4 = ekg1 * 1.3 + data.special_burdon;
  document.getElementById("ekg4").value = formatNumber(ekg4);

  const totalIncome = calculateTotalIncome(data);
  const totalExpenses = calculateTotalExpenses(data);

  const result = totalIncome - totalExpenses;

  resultOutput.textContent = formatEUR(result);

  const resultMessage = document.getElementById("result-message");

  if (result < ekg3) {
    resultMessage.textContent = "Die Kosten werden vollständig übernommen.";
    resultMessage.className = "font-medium text-green-600";
  } else if (result < ekg4) {
    resultMessage.textContent = "Die Kosten werden hälftig übernommen.";
    resultMessage.className = "font-medium text-yellow-600";
  } else {
    resultMessage.textContent = "Es erfolgt keine Übernahme der Kosten.";
    resultMessage.className = "font-medium text-red-600";
  }
}

/* ------------------ */
/* Calculations       */
/* ------------------ */

function calculateTotalIncome(data) {
  let parentIncome = 0;

  parentIncome =
    data.split_a_income +
    data.split_a_other_income +
    data.split_b_income +
    data.split_b_other_income;

  return data.child_benefit + data.child_support + parentIncome;
}

function calculateTotalExpenses(data) {
  let parentExpenses = 0;

  parentExpenses =
    data.split_a_expenses +
    data.split_a_commute +
    data.split_b_expenses +
    data.split_b_commute;

  // general deductions
  return (
    parentExpenses +
    data.insurance_home +
    data.insurance_accident +
    data.other_deductions
  );
}

/* ------------------ */
/* Helpers            */
/* ------------------ */

function getFormValues(form) {
  const values = {};

  for (const element of form.elements) {
    if (!element.name) continue;

    if (element.type === "checkbox") {
      values[element.name] = element.checked;
    } else {
      values[element.name] = toNumber(element.value);
    }
  }

  return values;
}

function toNumber(value) {
  return Number.parseFloat(value) || 0;
}

function formatEUR(value) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function formatNumber(value) {
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
