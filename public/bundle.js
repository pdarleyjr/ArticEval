var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// public/assets/js/template-engine.js
var template_engine_exports = {};
__export(template_engine_exports, {
  templateEngine: () => templateEngine
});
var TemplateEngine, templateEngine;
var init_template_engine = __esm({
  "public/assets/js/template-engine.js"() {
    TemplateEngine = class {
      constructor() {
        this.templates = /* @__PURE__ */ new Map();
        this.initializeTemplates();
      }
      // Initialize default templates
      initializeTemplates() {
        this.registerTemplate("clientInfo", (data) => {
          const name = `${data.firstName || ""} ${data.lastName || ""}`.trim();
          const dob = this.formatDate(data.dateOfBirth);
          const age = this.formatAge(data.age);
          const evalDate = this.formatDate(data.evaluationDate);
          let info = `
                <div class="client-info-section avoid-break">
                    <p><strong>Client Name:</strong> ${this.escapeHTML(name)}</p>
                    ${dob ? `<p><strong>Date of Birth:</strong> ${dob}</p>` : ""}
                    ${age ? `<p><strong>Age:</strong> ${age}</p>` : ""}
                    ${evalDate ? `<p><strong>Evaluation Date:</strong> ${evalDate}</p>` : ""}
                    ${data.referralSource ? `<p><strong>Referral Source:</strong> ${this.escapeHTML(data.referralSource)}</p>` : ""}
                    ${data.evaluator ? `<p><strong>Evaluator:</strong> ${this.escapeHTML(data.evaluator)}</p>` : ""}
                </div>
                ${data.reasonForReferral ? `
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #2C5282; margin-bottom: 10px;">Reason for Referral</h3>
                    <p>${this.escapeHTML(data.reasonForReferral)}</p>
                </div>` : ""}
            `;
          return info;
        });
        this.registerTemplate("clinicalImpressions", (data) => {
          const name = `${data.firstName || ""} ${data.lastName || ""}`.trim();
          const age = this.formatAge(data.age);
          const assessmentComponents = [];
          if (data.standardizedAssessment) assessmentComponents.push("formal assessment");
          if (data.backgroundInfo) assessmentComponents.push("parent interview");
          if (data.speechSample || data.languageSample) assessmentComponents.push("clinical observation");
          if (data.oralMechanism) assessmentComponents.push("oral mechanism examination");
          if (data.speechSound) assessmentComponents.push("speech sound assessment");
          let assessmentText = assessmentComponents.length > 0 ? assessmentComponents.join(", ").replace(/,([^,]*)$/, " and$1") : "formal and informal assessment";
          let impression = `Based on the results of ${assessmentText}, ${name}`;
          if (age) {
            impression += ` (${age})`;
          }
          impression += " presents with ";
          let hasContent = false;
          if (data.backgroundInfo) {
            impression += this.getBackgroundInfoSummary(data);
            hasContent = true;
          }
          if (data.standardizedAssessment) {
            impression += this.getStandardizedAssessmentSummary(data);
            hasContent = true;
          }
          if (data.speechSound) {
            impression += this.getSpeechSoundSummary(data);
            hasContent = true;
          }
          if (data.oralMechanism) {
            impression += this.getOralMechanismSummary(data);
            hasContent = true;
          }
          if (data.articulationInfo || data.articulationAnalysis) {
            impression += this.getArticulationAnalysisSummary(data);
            hasContent = true;
          }
          if (!hasContent) {
            impression += "speech and language skills that require further assessment. ";
          }
          if (data.speechSample) {
            impression += this.getSpeechSampleSummary(data);
            hasContent = true;
          }
          if (data.languageSample) {
            impression += this.getLanguageSampleSummary(data);
            hasContent = true;
          }
          if (data.sampleInsights && data.sampleInsights.commonObservations && data.sampleInsights.commonObservations.length > 0) {
            impression += "\n\nComparison with similar cases suggests ";
            const randomIndex = Math.floor(Math.random() * data.sampleInsights.commonObservations.length);
            const observation = data.sampleInsights.commonObservations[randomIndex];
            if (observation) {
              impression += observation.toLowerCase() + ". ";
            }
          }
          impression += "\n\nBased on these results and with appropriate intervention and family support, prognosis for improved communication skills is favorable.";
          if (data.prognosisEvidence) {
            impression += " " + data.prognosisEvidence;
          }
          impression += " Regular attendance and participation in therapy sessions, along with consistent home practice, will be essential for optimal progress.";
          let wrappedImpression;
          if (data.naturalText) {
            const paragraphs = impression.split(/\n\n/);
            wrappedImpression = paragraphs.map((para) => `<p>${para.trim()}</p>`).join("");
          } else {
            const sentences = impression.split(/(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s/);
            wrappedImpression = sentences.map((sentence) => `<div class="sentence avoid-break">${sentence.trim()}</div>`).join("");
          }
          return data.naturalText ? `<div class="natural-text">${wrappedImpression}</div>` : wrappedImpression;
        });
        this.registerTemplate("recommendations", (data) => {
          let recommendations = "Based on the information obtained through the assessment tools and parent interview, the following recommendations are made:\n\n";
          const recs = /* @__PURE__ */ new Set();
          if (data.backgroundInfo) {
            recs.add("Continued monitoring of developmental milestones");
          }
          if (data.speechSound) {
            if (data.speechSound.articulation && data.speechSound.articulation.errorPatterns && data.speechSound.articulation.errorPatterns.length > 0) {
              recs.add("Individual speech therapy focusing on sound production and phonological processes");
              const errorPatterns = data.speechSound.articulation.errorPatterns;
              if (errorPatterns.some((p) => p.sound.includes("s"))) {
                recs.add("Targeted intervention for sibilant sounds");
              }
              if (errorPatterns.some((p) => p.sound.includes("r") || p.sound.includes("l"))) {
                recs.add("Focused therapy on liquid sounds (r, l)");
              }
            }
          }
          if (data.oralMechanism) {
            const structure = data.oralMechanism.structure || {};
            const functionData = data.oralMechanism.function || {};
            if (structure.mandibleConcern || structure.lipsConcern || functionData.jawConcern || functionData.motorConcern) {
              recs.add("Oral motor exercises and activities to improve muscle strength and coordination");
            }
          }
          if (data.languageSample) {
            recs.add("Language stimulation activities to support expressive and receptive language development");
          }
          if (Array.isArray(data.protocol)) {
            if (data.protocol.includes("backgroundInfo")) {
              recs.add("Continued monitoring of developmental milestones");
            }
            if (data.protocol.includes("speechSound")) {
              recs.add("Individual speech therapy focusing on sound production and phonological processes");
            }
            if (data.protocol.includes("oralMechanism")) {
              recs.add("Oral motor exercises and activities to improve muscle strength and coordination");
            }
            if (data.protocol.includes("otherComponent") && data.otherComponentText) {
              recs.add(data.otherComponentText);
            }
          }
          if (data.sampleInsights && data.sampleInsights.commonRecommendations && data.sampleInsights.commonRecommendations.length > 0) {
            const commonRecs = data.sampleInsights.commonRecommendations;
            for (let i = 0; i < Math.min(2, commonRecs.length); i++) {
              if (commonRecs[i] && typeof commonRecs[i] === "string" && commonRecs[i].trim()) {
                recs.add(commonRecs[i].trim());
              }
            }
          }
          if (recs.size === 0) {
            recs.add("Continued monitoring of speech and language development");
          }
          if (data.standardizedAssessment) {
            const { tl } = data.standardizedAssessment;
            if (tl && tl.standardScore) {
              if (tl.standardScore < 85) {
                recs.add("Regular speech-language therapy sessions");
                recs.add("Home practice program to reinforce therapy goals");
                recs.add("Reevaluation in 6 months to monitor progress");
              }
            }
          }
          if (data.referral && data.referralDetails && data.referralDetails.trim()) {
            recs.add(`Referral to: ${data.referralDetails || ""}`);
          }
          if (data.otherRecommendations && data.otherRecommendations.trim()) {
            recs.add(data.otherRecommendations);
          }
          if (data.naturalText) {
            return `<div class="natural-text">
                    <p>${recommendations}</p>
                    ${Array.from(recs).map((rec) => `<p>\u2022 ${rec}</p>`).join("")}
                </div>`;
          } else {
            return `<div class="recommendations-section avoid-break">
                    ${recommendations}
                    ${Array.from(recs).map((rec) => `<div class="recommendation-item avoid-break">\u2022 ${rec}</div>`).join("")}
                </div>`;
          }
        });
        this.registerTemplate("oralMechanismSummary", (data) => this.getOralMechanismSummary(data));
        this.registerTemplate("speechSoundSummary", (data) => this.getSpeechSoundSummary(data));
        this.registerTemplate("articulationAnalysisSummary", (data) => this.getArticulationAnalysisSummary(data));
      }
      // New helper method for background info summary
      getBackgroundInfoSummary(data) {
        let summary = "";
        if (data.backgroundInfo) {
          const { developmentalHistory = "", medicalHistory = "", familyHistory = "" } = data.backgroundInfo;
          if (developmentalHistory) {
            summary += `developmental history ${developmentalHistory.toLowerCase()}`;
          }
          if (medicalHistory) {
            summary += summary ? " and " : "";
            summary += `medical history ${medicalHistory.toLowerCase()}`;
          }
          if (familyHistory) {
            summary += ". Family history includes " + familyHistory.toLowerCase();
          }
          summary += ". ";
        }
        return summary;
      }
      // New helper method for speech sample summary
      getSpeechSampleSummary(data) {
        let summary = "";
        if (data.speechSample && typeof data.speechSample.observations === "string" && data.speechSample.observations.trim()) {
          summary += `

During connected speech sample, ${data.speechSample.observations.toLowerCase().trim()}. `;
        } else if (data.speechSampleAnalysis) {
          if (typeof data.speechSampleAnalysis.observations === "string" && data.speechSampleAnalysis.observations.trim()) {
            summary += `

During connected speech sample, ${data.speechSampleAnalysis.observations.toLowerCase().trim()}. `;
          }
          if (data.speechSampleAnalysis.commonPatterns && data.speechSampleAnalysis.commonPatterns.length > 0) {
            summary += `

The following patterns were observed: ${data.speechSampleAnalysis.commonPatterns.join(", ")}. `;
          }
        }
        return summary;
      }
      // New helper method for language sample summary
      getLanguageSampleSummary(data) {
        let summary = "";
        if (data.languageSample && typeof data.languageSample.observations === "string" && data.languageSample.observations.trim()) {
          summary += `

Language sample analysis revealed ${data.languageSample.observations.toLowerCase().trim()}. `;
        } else if (data.languageSampleAnalysis) {
          if (typeof data.languageSampleAnalysis.observations === "string" && data.languageSampleAnalysis.observations.trim()) {
            summary += `

Language sample analysis revealed ${data.languageSampleAnalysis.observations.toLowerCase().trim()}. `;
          }
          if (data.languageSampleAnalysis.commonFeatures && data.languageSampleAnalysis.commonFeatures.length > 0) {
            summary += `

The following language features were assessed: ${data.languageSampleAnalysis.commonFeatures.join(", ")}. `;
          }
        }
        return summary;
      }
      // New helper method for articulation analysis summary
      getArticulationAnalysisSummary(data) {
        let summary = "";
        if (data.articulationAnalysis && data.articulationAnalysis.patterns && data.articulationAnalysis.patterns.length > 0) {
          summary += "\n\nAnalysis of articulation patterns revealed the presence of ";
          summary += data.articulationAnalysis.patterns.join(", ");
          summary += ". ";
          if (data.articulationAnalysis.implications && data.articulationAnalysis.implications.length > 0) {
            summary += "These patterns suggest ";
            summary += data.articulationAnalysis.implications.join(" and ");
            summary += ". ";
          }
        }
        if (data.articulationInfo) {
          if (data.speechSound && data.articulationInfo.standardizedTests) {
            const tests = data.articulationInfo.standardizedTests;
            if (tests.length > 0) {
              summary += `

The assessment utilized standardized measures including ${tests[0].name}, which ${tests[0].description} `;
            }
          }
          if (data.speechSound && data.articulationInfo.phonologicalProcesses) {
            summary += "\n\nIt is important to note that some of the observed phonological processes are developmentally appropriate, while others may require targeted intervention. ";
          }
        }
        return summary;
      }
      // Helper methods for generating specific parts of the summary
      getStandardizedAssessmentSummary(data) {
        let summary = "";
        if (data.standardizedAssessment && Object.keys(data.standardizedAssessment).length > 0) {
          const { ac, ec, tl } = data.standardizedAssessment;
          if (tl && tl.standardScore) {
            const score = tl.standardScore;
            if (score >= 85) {
              summary += "overall speech-language skills that are developing within normal limits";
            } else if (score >= 78) {
              summary += "mild delays in overall speech and language development";
            } else if (score >= 71) {
              summary += "moderate delays in overall speech and language development";
            } else {
              summary += "severe delays in overall speech and language development";
            }
            if (ac && ac.standardScore) {
              summary += `. Auditory comprehension skills are in the ${ac.severity.toLowerCase()} range`;
            }
            if (ec && ec.standardScore) {
              summary += `, and expressive communication skills are in the ${ec.severity.toLowerCase()} range`;
            }
            summary += ". ";
          } else {
            summary += "speech-language skills that require further assessment. ";
          }
        }
        return summary;
      }
      getOralMechanismSummary(data) {
        let summary = "\n\nOral mechanism examination revealed: ";
        if (data.oralMechanism && (data.oralMechanism.structure || data.oralMechanism.function)) {
          const oralMechData = data.oralMechanismAnalysis || data.oralMechanism;
          const structure = oralMechData.structure || {};
          const functionData = oralMechData.function || {};
          const overallNotes = oralMechData.overallNotes;
          summary += `
Structure Assessment:
`;
          if (Object.keys(structure).length > 0) {
            summary += `- Face: ${structure.faceWNL ? "Within Normal Limits" : structure.faceConcern ? "Area of Concern" : "Not assessed"}
`;
            summary += `- Mandible: ${structure.mandibleWNL ? "Within Normal Limits" : structure.mandibleConcern ? "Area of Concern" : "Not assessed"}
`;
            summary += `- Teeth: ${structure.teethWNL ? "Within Normal Limits" : structure.teethConcern ? "Area of Concern" : "Not assessed"}
`;
            summary += `- Palatal: ${structure.palatalWNL ? "Within Normal Limits" : structure.palatalConcern ? "Area of Concern" : "Not assessed"}
`;
            summary += `- Lips: ${structure.lipsWNL ? "Within Normal Limits" : structure.lipsConcern ? "Area of Concern" : "Not assessed"}
`;
            if (structure.structureNotes) {
              summary += `
Structure Notes: ${structure.structureNotes}
`;
            }
          }
          summary += `
Function Assessment:
`;
          if (Object.keys(functionData).length > 0) {
            summary += `- Jaw Movement: ${functionData.jawWNL ? "Within Normal Limits" : functionData.jawConcern ? "Area of Concern" : "Not assessed"}
`;
            summary += `- Velopharyngeal Function: ${functionData.velopharyngealWNL ? "Within Normal Limits" : functionData.velopharyngealConcern ? "Area of Concern" : "Not assessed"}
`;
            summary += `- Phonation: ${functionData.phonationWNL ? "Within Normal Limits" : functionData.phonationConcern ? "Area of Concern" : "Not assessed"}
`;
            summary += `- Oral Reflexes: ${functionData.reflexesWNL ? "Within Normal Limits" : functionData.reflexesConcern ? "Area of Concern" : "Not assessed"}
`;
            summary += `- Motor Coordination: ${functionData.motorWNL ? "Within Normal Limits" : functionData.motorConcern ? "Area of Concern" : "Not assessed"}
`;
            if (functionData.functionNotes) {
              summary += `
Function Notes: ${functionData.functionNotes}
`;
            }
          }
          if (overallNotes) {
            summary += `
Overall Notes: ${overallNotes}
`;
          }
        }
        return summary;
      }
      getSpeechSoundSummary(data) {
        let summary = "\n\nSpeech sound assessment revealed: ";
        if (data.speechSound && (data.speechSound.articulation || data.speechSound.intelligibility)) {
          const speechSoundData = data.speechSoundAnalysis || data.speechSound;
          const articulation = speechSoundData.articulation;
          const intelligibility = speechSoundData.intelligibility || {};
          const overallNotes = speechSoundData.overallNotes;
          if (articulation && articulation.errorPatterns && articulation.errorPatterns.length) {
            summary += `
Error Patterns:
`;
            articulation.errorPatterns.forEach((pattern) => {
              summary += `- Substitution of ${pattern.substitution} for ${pattern.sound} in ${pattern.positions.join(", ")} positions.
`;
            });
          }
          if (articulation && articulation.developmentallyAppropriateErrors && articulation.developmentallyAppropriateErrors.length) {
            summary += `
Developmentally Appropriate Errors (to monitor):
`;
            articulation.developmentallyAppropriateErrors.forEach((error) => {
              summary += `- Substitution of ${error.substitution} for ${error.sound} (e.g., ${error.example})
`;
            });
          }
          if (articulation && articulation.phonemeInventory && articulation.phonemeInventory.length) {
            summary += `
Phoneme Inventory (partial):
- ${articulation.phonemeInventory.join(", ")}
`;
          }
          if (articulation && articulation.stimulability) {
            summary += `
Stimulability: ${articulation.stimulability}
`;
          }
          if (articulation && articulation.consistency) {
            summary += `
Consistency of Errors: ${articulation.consistency}
`;
          }
          summary += `
Intelligibility:
`;
          if (Object.keys(intelligibility).length > 0) {
            summary += `- Familiar Listeners: ${intelligibility.familiarHigh ? "High" : intelligibility.familiarModerate ? "Moderate" : intelligibility.familiarPoor ? "Poor" : intelligibility.familiarVeryPoor ? "Very Poor" : "Not assessed"}
`;
            summary += `- Unfamiliar Listeners: ${intelligibility.unfamiliarHigh ? "High" : intelligibility.unfamiliarModerate ? "Moderate" : intelligibility.unfamiliarPoor ? "Poor" : intelligibility.unfamiliarVeryPoor ? "Very Poor" : "Not assessed"}
`;
            summary += intelligibility.intelligibilityNotes ? `
Notes: ${intelligibility.intelligibilityNotes}
` : "";
          }
          if (overallNotes) {
            summary += `
Overall Notes: ${overallNotes}
`;
          }
        }
        return summary;
      }
      // Register a template
      registerTemplate(name, template) {
        this.templates.set(name, template);
      }
      // Render a template with data
      render(name, data = {}) {
        const template = this.templates.get(name);
        if (!template) {
          throw new Error(`Template "${name}" not found`);
        }
        return template(data);
      }
      // Helper method to escape HTML
      escapeHTML(str) {
        const div = document.createElement("div");
        div.textContent = str;
        return div.innerHTML;
      }
      // Helper method to format dates
      formatDate(date) {
        if (!date) return "";
        return new Date(date).toLocaleDateString();
      }
      // Helper method to format age
      formatAge(age) {
        if (!age) return "";
        if (typeof age === "string" && age.includes("years")) {
          return age;
        }
        if (typeof age === "object" && age !== null) {
          const years2 = age.years || 0;
          const months = age.months || 0;
          if (years2 === 0) {
            return `${months} month${months !== 1 ? "s" : ""} old`;
          }
          if (months === 0) {
            return `${years2} year${years2 !== 1 ? "s" : ""} old`;
          }
          return `${years2} year${years2 !== 1 ? "s" : ""}, ${months} month${months !== 1 ? "s" : ""} old`;
        }
        const years = parseInt(age);
        if (!isNaN(years)) {
          return `${years} year${years !== 1 ? "s" : ""} old`;
        }
        return "";
      }
      // Generate complete summary
      generateSummary(formData) {
        try {
          const impressions = this.render("clinicalImpressions", { ...formData, naturalText: formData.generateForPDF });
          const recommendations = this.render("recommendations", { ...formData, naturalText: formData.generateForPDF });
          return `<div class="summary-container">
                ${impressions}
                ${recommendations}
            </div>`;
        } catch (error) {
          console.error("Error generating summary:", error);
          return "Error generating summary. Please try again.";
        }
      }
    };
    templateEngine = new TemplateEngine();
  }
});

// public/assets/js/form-handler.js
var FormHandler = class {
  constructor() {
    this.formSections = {
      patientInfo: /* @__PURE__ */ new Map(),
      protocol: /* @__PURE__ */ new Set(),
      standardizedAssessment: /* @__PURE__ */ new Map(),
      background: /* @__PURE__ */ new Map(),
      socialBehavioral: /* @__PURE__ */ new Map(),
      languageSample: /* @__PURE__ */ new Map(),
      oralMechanism: /* @__PURE__ */ new Map(),
      // Will be structured data
      speechSound: /* @__PURE__ */ new Map(),
      // Will be structured data
      speechSample: /* @__PURE__ */ new Map(),
      clinicalImpressions: /* @__PURE__ */ new Map()
    };
    this.autosaveTimeout = null;
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.initializeHandlers());
    } else {
      this.initializeHandlers();
    }
  }
  initializeHandlers() {
    try {
      this.initializePatientInfoHandlers();
      this.initializeProtocolHandlers();
      this.initializeStandardizedAssessmentHandlers();
      this.initializeBackgroundHandlers();
      this.initializeSocialBehavioralHandlers();
      this.initializeLanguageSampleHandlers();
      this.initializeOralMechanismHandlers();
      this.initializeSpeechSoundHandlers();
      this.initializeSpeechSampleHandlers();
      this.initializeClinicalImpressionHandlers();
      this.setupFormEventListeners();
      this.loadSavedData();
    } catch (error) {
      console.error("Error initializing form handlers:", error);
    }
  }
  setupFormEventListeners() {
    const form = document.getElementById("evaluationForm");
    if (form) {
      form.addEventListener("input", (event) => {
        this.handleFieldChange(event.target);
        this.scheduleAutosave();
      });
      form.addEventListener("change", (event) => {
        this.handleFieldChange(event.target);
        this.scheduleAutosave();
      });
    }
  }
  // Patient Information Handlers
  initializePatientInfoHandlers() {
    const dobInput = document.getElementById("dob");
    const evaluationDateInput = document.getElementById("evaluationDate");
    const ageInput = document.getElementById("age");
    if (dobInput && evaluationDateInput && ageInput) {
      const calculateAge = () => {
        if (dobInput.value && evaluationDateInput.value) {
          const dob = new Date(dobInput.value);
          const evalDate = new Date(evaluationDateInput.value);
          const ageInMilliseconds = evalDate - dob;
          const ageDate = new Date(Math.abs(ageInMilliseconds));
          const years = Math.abs(ageDate.getUTCFullYear() - 1970);
          const months = ageDate.getUTCMonth();
          ageInput.value = `${years} years, ${months} months`;
        }
      };
      dobInput.addEventListener("change", calculateAge);
      evaluationDateInput.addEventListener("change", calculateAge);
    }
  }
  // Protocol Handlers
  initializeProtocolHandlers() {
    const protocolCheckboxes = document.querySelectorAll('#protocol input[type="checkbox"]');
    protocolCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          this.formSections.protocol.add(checkbox.id);
        } else {
          this.formSections.protocol.delete(checkbox.id);
        }
      });
    });
  }
  // Background Handlers
  initializeBackgroundHandlers() {
    const backgroundFields = document.querySelectorAll("#backgroundInfo input, #backgroundInfo textarea");
    backgroundFields.forEach((field) => {
      field.addEventListener("change", () => {
        this.formSections.background.set(field.id, this.getFieldValue(field));
      });
    });
  }
  // Social Behavioral Handlers
  initializeSocialBehavioralHandlers() {
    const behavioralFields = document.querySelectorAll('#socialBehavioral input[type="checkbox"]');
    behavioralFields.forEach((field) => {
      field.addEventListener("change", () => {
        this.formSections.socialBehavioral.set(field.id, field.checked);
      });
    });
  }
  // Language Sample Handlers
  initializeLanguageSampleHandlers() {
    const sampleFields = document.querySelectorAll("#languageSample textarea");
    sampleFields.forEach((field) => {
      field.addEventListener("input", () => {
        this.formSections.languageSample.set(field.id, field.value);
      });
    });
  }
  // Oral Mechanism Handlers
  initializeOralMechanismHandlers() {
    const structureFields = document.querySelectorAll("#oralMechanism-structure input, #oralMechanism-structure textarea");
    structureFields.forEach((field) => {
      field.addEventListener("change", () => {
        this.formSections.oralMechanism.set(["structure", field.id], this.getFieldValue(field));
      });
    });
    const functionFields = document.querySelectorAll("#oralMechanism-function input, #oralMechanism-function textarea");
    functionFields.forEach((field) => {
      field.addEventListener("change", () => {
        this.formSections.oralMechanism.set(["function", field.id], this.getFieldValue(field));
      });
    });
    const overallNotesField = document.getElementById("oralMechanismOverallNotes");
    if (overallNotesField) {
      overallNotesField.addEventListener("input", () => {
        this.formSections.oralMechanism.set(["overallNotes"], overallNotesField.value);
      });
    }
  }
  // Speech Sound Handlers
  initializeSpeechSoundHandlers() {
    const articulationFields = document.querySelectorAll("#speechSound-articulation input, #speechSound-articulation textarea");
    articulationFields.forEach((field) => {
      field.addEventListener("change", () => {
        this.formSections.speechSound.set(["articulation", field.id], this.getFieldValue(field));
      });
    });
    const intelligibilityFields = document.querySelectorAll("#speechSound-intelligibility input, #speechSound-intelligibility textarea");
    intelligibilityFields.forEach((field) => {
      field.addEventListener("change", () => {
        this.formSections.speechSound.set(["intelligibility", field.id], this.getFieldValue(field));
      });
    });
    const overallNotesField = document.getElementById("speechSoundOverallNotes");
    if (overallNotesField) {
      overallNotesField.addEventListener("input", () => {
        this.formSections.speechSound.set(["overallNotes"], overallNotesField.value);
      });
    }
  }
  // Speech Sample Handlers
  initializeSpeechSampleHandlers() {
    const sampleFields = document.querySelectorAll("#speechSample textarea");
    sampleFields.forEach((field) => {
      field.addEventListener("input", () => {
        this.formSections.speechSample.set(field.id, field.value);
      });
    });
  }
  // Clinical Impression Handlers
  initializeClinicalImpressionHandlers() {
    const impressionFields = document.querySelectorAll("#clinicalImpressions textarea");
    impressionFields?.forEach((field) => {
      field.addEventListener("input", (event) => {
        this.formSections.clinicalImpressions.set(field.id, field.value);
      });
    });
  }
  // Standardized Assessment Handlers
  initializeStandardizedAssessmentHandlers() {
    const subtests = ["ac", "ec", "tl"];
    subtests.forEach((subtest) => {
      const standardScoreInput = document.getElementById(`${subtest}_standard_score`);
      const severityInput = document.getElementById(`${subtest}_severity`);
      if (standardScoreInput && severityInput) {
        standardScoreInput.addEventListener("input", () => {
          const score = parseInt(standardScoreInput.value);
          severityInput.value = this.calculateSeverity(score);
        });
      }
    });
  }
  calculateSeverity(score) {
    if (!score) return "";
    if (score > 115) return "Above Average";
    if (score >= 85) return "Average/Within Normal Limits";
    if (score >= 78) return "Marginal/Below Average/Mild";
    if (score >= 71) return "Low Range/Moderate";
    if (score >= 50) return "Very Low Range/Severe";
    return "Profound";
  }
  handleFieldChange(field) {
    if (!field.id && !field.name) return;
    const value = this.getFieldValue(field);
    const key = field.id || field.name;
    Object.entries(this.formSections).forEach(([section, data]) => {
      if (field.closest(`#${section}`)) {
        if (data instanceof Set) {
          if (field.type === "checkbox") {
            if (field.checked) {
              data.add(key);
            } else {
              data.delete(key);
            }
          }
        } else {
          data.set(key, value === "" ? null : value);
        }
      }
    });
    this.updateDependentFields(field);
  }
  getFieldValue(field) {
    switch (field.type) {
      case "checkbox":
        return field.checked;
      case "radio":
        return field.checked ? field.value : null;
      default:
        return field.value;
    }
  }
  updateDependentFields(field) {
    if (field.type === "checkbox" && field.id.startsWith("other")) {
      const textInput = document.getElementById(`${field.id}Text`);
      if (textInput) {
        textInput.disabled = !field.checked;
        if (!field.checked) {
          textInput.value = "";
        }
      }
    }
  }
  scheduleAutosave() {
    if (this.autosaveTimeout) {
      clearTimeout(this.autosaveTimeout);
    }
    this.autosaveTimeout = setTimeout(() => this.saveFormData(), 1e3);
  }
  saveFormData() {
    try {
      const data = this.collectFormData();
      localStorage.setItem("evaluationFormData", JSON.stringify(data));
    } catch (error) {
      console.error("Error saving form data:", error);
    }
  }
  loadSavedData() {
    try {
      const savedData = localStorage.getItem("evaluationFormData");
      if (savedData) {
        const data = JSON.parse(savedData);
        this.populateForm(data);
      }
    } catch (error) {
      console.error("Error loading saved data:", error);
    }
  }
  populateForm(data) {
    Object.entries(data || {}).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === "checkbox") {
          element.checked = value;
        } else if (element.type === "radio") {
          element.checked = element.value === value;
        } else {
          element.value = value || "";
        }
      }
    });
  }
  collectFormData() {
    const form = document.getElementById("evaluationForm");
    if (!form) return {};
    let formData = {};
    form.querySelectorAll("input, textarea, select").forEach((element) => {
      if (element.id || element.name) {
        const key = element.id || element.name;
        const value = this.getFieldValue(element);
        if (value !== null && value !== "") {
          formData[key] = value;
        }
      }
    });
    const subtests = ["ac", "ec", "tl"];
    formData.standardizedAssessment = {};
    let hasStandardizedData = false;
    subtests.forEach((subtest) => {
      const score = document.getElementById(`${subtest}_standard_score`)?.value;
      const severity = document.getElementById(`${subtest}_severity`)?.value;
      if (score) {
        formData.standardizedAssessment[subtest] = { standardScore: parseInt(score), severity };
        hasStandardizedData = true;
      }
    });
    if (!hasStandardizedData) {
      delete formData.standardizedAssessment;
    }
    const backgroundFields = document.querySelectorAll('#backgroundInfo textarea, #backgroundInfo input:not([type="checkbox"])');
    formData.backgroundInfo = {};
    backgroundFields.forEach((field) => {
      if (field.value) {
        formData.backgroundInfo[field.id] = field.value;
      }
    });
    if (Object.keys(formData.backgroundInfo).length === 0) delete formData.backgroundInfo;
    Object.entries(this.formSections).forEach(([section, data]) => {
      if (data instanceof Map) {
        if (section === "oralMechanism" || section === "speechSound") {
          formData[section] = {};
          data.forEach((value, key) => {
            if (Array.isArray(key)) {
              if (key && key[0]) {
                formData[section][key[0]] = formData[section][key[0]] || {};
                if (key[1]) {
                  formData[section][key[0]][key[1]] = value;
                }
              }
            } else {
              formData[section][key] = value;
            }
          });
        } else {
          data.forEach((value, key) => {
            if (value !== null && value !== "") {
              formData[key] = value;
            }
          });
        }
      } else if (data instanceof Set && data.size > 0) {
        formData[section] = Array.from(data);
      }
    });
    Object.entries(formData).forEach(([key, value]) => {
      if (value === void 0 || value === null) delete formData[key];
    });
    const speechSampleField = document.querySelector("#speechSample textarea") || document.getElementById("speechSampleObservations");
    if (speechSampleField && speechSampleField.value && speechSampleField.value.trim()) {
      formData.speechSample = formData.speechSample || {
        observations: speechSampleField.value.trim()
      };
    } else {
      delete formData.speechSample;
    }
    const languageSampleField = document.querySelector("#languageSample textarea") || document.getElementById("languageSampleObservations");
    if (languageSampleField && languageSampleField.value && languageSampleField.value.trim()) {
      formData.languageSample = formData.languageSample || {
        observations: languageSampleField.value.trim()
      };
    } else {
      delete formData.languageSample;
    }
    if (formData.oralMechanism) {
      formData.oralMechanism.structure = formData.oralMechanism.structure || {};
      formData.oralMechanism.function = formData.oralMechanism.function || {};
      ["face", "mandible", "teeth", "palatal", "lips"].forEach((part) => {
        const wnlCheckbox = document.getElementById(`${part}WNL`);
        const concernCheckbox = document.getElementById(`${part}Concern`);
        if (wnlCheckbox) {
          formData.oralMechanism.structure[`${part}WNL`] = wnlCheckbox.checked;
        }
        if (concernCheckbox) {
          formData.oralMechanism.structure[`${part}Concern`] = concernCheckbox.checked;
        }
      });
      ["jaw", "velopharyngeal", "phonation", "reflexes", "motor"].forEach((part) => {
        const wnlCheckbox = document.getElementById(`${part}WNL`);
        const concernCheckbox = document.getElementById(`${part}Concern`);
        if (wnlCheckbox) {
          formData.oralMechanism.function[`${part}WNL`] = wnlCheckbox.checked;
        }
        if (concernCheckbox) {
          formData.oralMechanism.function[`${part}Concern`] = concernCheckbox.checked;
        }
      });
      const structureNotesField = document.getElementById("structureNotes");
      if (structureNotesField && structureNotesField.value) {
        formData.oralMechanism.structure.structureNotes = structureNotesField.value;
      }
      const functionNotesField = document.getElementById("functionNotes");
      if (functionNotesField && functionNotesField.value) {
        formData.oralMechanism.function.functionNotes = functionNotesField.value;
      }
      const overallNotesField = document.getElementById("oralMechanismOverallNotes");
      if (overallNotesField && overallNotesField.value) {
        formData.oralMechanism.overallNotes = overallNotesField.value;
      }
    }
    if (formData.speechSound) {
      formData.speechSound.articulation = formData.speechSound.articulation || {};
      formData.speechSound.intelligibility = formData.speechSound.intelligibility || {};
      const errorPatterns = [];
      const sounds = ["p", "b", "t", "d", "k", "g", "f", "v", "s", "z", "sh", "ch", "j", "th", "r", "l", "w", "y", "h", "m", "n", "ng"];
      sounds.forEach((sound) => {
        const misarticulatedCheckbox = document.getElementById(`sound_${sound}_misarticulated`);
        if (misarticulatedCheckbox && misarticulatedCheckbox.checked) {
          const typeSelect = document.getElementById(`sound_${sound}_type`);
          const positionSelect = document.getElementById(`sound_${sound}_position`);
          const detailInput = document.getElementById(`sound_${sound}_detail`);
          if (typeSelect && typeSelect.value) {
            errorPatterns.push({
              sound: `/${sound}/`,
              substitution: typeSelect.value,
              positions: positionSelect ? [positionSelect.value] : ["all"],
              detail: detailInput ? detailInput.value : ""
            });
          }
        }
      });
      if (errorPatterns.length > 0) {
        formData.speechSound.articulation.errorPatterns = errorPatterns;
      }
      ["familiar", "unfamiliar"].forEach((listener) => {
        ["High", "Moderate", "Poor", "VeryPoor"].forEach((level) => {
          const checkbox = document.getElementById(`${listener}${level}`);
          if (checkbox) {
            formData.speechSound.intelligibility[`${listener}${level}`] = checkbox.checked;
          }
        });
      });
      const intelligibilityNotesField = document.getElementById("intelligibilityNotes");
      if (intelligibilityNotesField && intelligibilityNotesField.value) {
        formData.speechSound.intelligibility.intelligibilityNotes = intelligibilityNotesField.value;
      }
      const overallNotesField = document.getElementById("speechSoundOverallNotes");
      if (overallNotesField && overallNotesField.value) {
        formData.speechSound.overallNotes = overallNotesField.value;
      }
    }
    const clinicalImpressionsSummary = document.getElementById("clinicalImpressionsSummary");
    if (clinicalImpressionsSummary && clinicalImpressionsSummary.innerHTML) {
      formData.clinicalImpressionsText = clinicalImpressionsSummary.innerHTML;
    }
    return formData;
  }
  handleFormSubmission() {
    try {
      if (this.validateForm()) {
        const formData = this.collectFormData();
        this.saveFormData();
        return formData;
      }
      return null;
    } catch (error) {
      console.error("Error handling form submission:", error);
      return null;
    }
  }
  validateForm() {
    let isValid = true;
    const requiredFields = document.querySelectorAll("[required]");
    requiredFields.forEach((field) => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });
    return isValid;
  }
  validateField(field) {
    const value = this.getFieldValue(field);
    const isValid = value !== null && value !== "";
    field.classList.toggle("is-invalid", !isValid);
    const errorDiv = field.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains("invalid-feedback")) {
      errorDiv.style.display = isValid ? "none" : "block";
    }
    return isValid;
  }
};
var form_handler_default = FormHandler;

// public/assets/js/main.js
init_template_engine();

// public/assets/js/db-utils.js
var ValidationError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
};
var EvaluationDatabase = class {
  constructor() {
    this.dbName = "evaluationDB";
    this.db = null;
    this.isInitialized = false;
    this.initPromise = null;
  }
  // Initialize the database
  async init() {
    if (this.isInitialized) return Promise.resolve();
    if (this.initPromise) return this.initPromise;
    this.initPromise = new Promise((resolve, reject) => {
      try {
        if (typeof Dexie === "undefined") {
          return this.initWithIndexedDB().then(resolve).catch(reject);
        }
        this.db = new Dexie(this.dbName);
        this.db.version(1).stores({
          evaluations: "++id, patientName, dateCreated, *concerns, age",
          referenceData: "id, type, dateCreated"
        });
        this.db.open().then(() => {
          console.log("Database opened successfully with Dexie");
          this.isInitialized = true;
          resolve();
        }).catch((error) => {
          console.error("Failed to open database with Dexie:", error);
          this.initWithIndexedDB().then(resolve).catch(reject);
        });
      } catch (error) {
        console.error("Error initializing database with Dexie:", error);
        this.initWithIndexedDB().then(resolve).catch(reject);
      }
    });
    return this.initPromise;
  }
  // Fallback to native IndexedDB if Dexie is not available
  async initWithIndexedDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      request.onerror = () => {
        reject(new Error("Failed to open database with IndexedDB"));
      };
      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log("Database opened successfully with native IndexedDB");
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("evaluations")) {
          const store = db.createObjectStore("evaluations", { keyPath: "id", autoIncrement: true });
          store.createIndex("dateCreated", "dateCreated", { unique: false });
          store.createIndex("patientName", "patientName", { unique: false });
          store.createIndex("age", "age", { unique: false });
          console.log("Created evaluations store and indices");
        }
        if (!db.objectStoreNames.contains("referenceData")) {
          const store = db.createObjectStore("referenceData", { keyPath: "id" });
          store.createIndex("type", "type", { unique: false });
          store.createIndex("dateCreated", "dateCreated", { unique: false });
          console.log("Created reference data store and indices");
        }
      };
    });
  }
  // Validate evaluation data
  validateEvaluation(data) {
    if (!data || typeof data !== "object") {
      throw new ValidationError("Invalid evaluation data format");
    }
    if (data.isReferenceData) {
      if (!data.id) {
        throw new ValidationError("Reference data requires an ID");
      }
      return;
    }
    const requiredFields = ["firstName", "lastName"];
    const missingFields = requiredFields.filter((field) => !data[field]);
    if (missingFields.length > 0) {
      throw new ValidationError(`Missing required fields: ${missingFields.join(", ")}`);
    }
  }
  // Store evaluation data
  async storeEvaluation(data) {
    await this.init();
    try {
      const isReferenceData = data.isReferenceData || false;
      this.validateEvaluation(isReferenceData ? { ...data, isReferenceData: true } : data);
      const storeName = isReferenceData ? "referenceData" : "evaluations";
      const storeData = isReferenceData ? data : {
        ...data,
        dateCreated: /* @__PURE__ */ new Date(),
        lastModified: /* @__PURE__ */ new Date(),
        patientName: `${data.firstName} ${data.lastName}`.trim()
      };
      if (this.db instanceof Dexie) {
        return await this.db.table(storeName).add(storeData);
      }
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.add(storeData);
        request.onsuccess = () => {
          console.log("Successfully stored data:", request.result);
          resolve(request.result);
        };
        request.onerror = () => {
          reject(new Error("Failed to store data"));
        };
      });
    } catch (error) {
      console.error("Error storing evaluation:", error);
      throw error;
    }
  }
  // Retrieve evaluation by ID
  async getEvaluation(id) {
    await this.init();
    try {
      if (this.db instanceof Dexie) {
        let result = await this.db.evaluations.get(id);
        if (!result) {
          result = await this.db.referenceData.get(id);
        }
        if (!result) {
          throw new ValidationError(`Evaluation not found with ID: ${id}`);
        }
        return result;
      }
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["evaluations"], "readonly");
        const store = transaction.objectStore("evaluations");
        const request = store.get(id);
        request.onsuccess = () => {
          if (request.result) {
            resolve(request.result);
          } else {
            const refTransaction = this.db.transaction(["referenceData"], "readonly");
            const refStore = refTransaction.objectStore("referenceData");
            const refRequest = refStore.get(id);
            refRequest.onsuccess = () => {
              if (refRequest.result) {
                resolve(refRequest.result);
              } else {
                reject(new ValidationError(`Evaluation not found with ID: ${id}`));
              }
            };
            refRequest.onerror = () => {
              reject(new Error("Failed to retrieve evaluation"));
            };
          }
        };
        request.onerror = () => {
          reject(new Error("Failed to retrieve evaluation"));
        };
      });
    } catch (error) {
      console.error("Error retrieving evaluation:", error);
      throw error;
    }
  }
  // Update existing evaluation
  async updateEvaluation(id, data) {
    await this.init();
    try {
      this.validateEvaluation(data);
      if (this.db instanceof Dexie) {
        const existing = await this.db.evaluations.get(id);
        if (!existing) {
          throw new ValidationError(`Evaluation not found with ID: ${id}`);
        }
        const updatedEvaluation = {
          ...existing,
          ...data,
          lastModified: /* @__PURE__ */ new Date()
        };
        await this.db.evaluations.put(updatedEvaluation);
        return id;
      }
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["evaluations"], "readwrite");
        const store = transaction.objectStore("evaluations");
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
          if (!getRequest.result) {
            reject(new ValidationError(`Evaluation not found with ID: ${id}`));
            return;
          }
          const updatedEvaluation = {
            ...getRequest.result,
            ...data,
            lastModified: /* @__PURE__ */ new Date()
          };
          const putRequest = store.put(updatedEvaluation);
          putRequest.onsuccess = () => {
            resolve(id);
          };
          putRequest.onerror = () => {
            reject(new Error("Failed to update evaluation"));
          };
        };
        getRequest.onerror = () => {
          reject(new Error("Failed to retrieve evaluation for update"));
        };
      });
    } catch (error) {
      console.error("Error updating evaluation:", error);
      throw error;
    }
  }
  // Delete evaluation
  async deleteEvaluation(id) {
    await this.init();
    try {
      if (this.db instanceof Dexie) {
        const existing = await this.db.evaluations.get(id);
        if (!existing) {
          throw new ValidationError(`Evaluation not found with ID: ${id}`);
        }
        await this.db.evaluations.delete(id);
        return;
      }
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["evaluations"], "readwrite");
        const store = transaction.objectStore("evaluations");
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
          if (!getRequest.result) {
            reject(new ValidationError(`Evaluation not found with ID: ${id}`));
            return;
          }
          const deleteRequest = store.delete(id);
          deleteRequest.onsuccess = () => {
            resolve();
          };
          deleteRequest.onerror = () => {
            reject(new Error("Failed to delete evaluation"));
          };
        };
        getRequest.onerror = () => {
          reject(new Error("Failed to retrieve evaluation for deletion"));
        };
      });
    } catch (error) {
      console.error("Error deleting evaluation:", error);
      throw error;
    }
  }
  // Get all evaluations with filtering options
  async getAllEvaluations(options = {}) {
    await this.init();
    try {
      if (this.db instanceof Dexie) {
        let collection = this.db.evaluations.toCollection();
        if (options.fromDate) {
          collection = collection.filter(
            (record) => new Date(record.dateCreated) >= new Date(options.fromDate)
          );
        }
        if (options.toDate) {
          collection = collection.filter(
            (record) => new Date(record.dateCreated) <= new Date(options.toDate)
          );
        }
        return await collection.toArray();
      }
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["evaluations"], "readonly");
        const store = transaction.objectStore("evaluations");
        const request = store.getAll();
        request.onsuccess = () => {
          let records = request.result;
          if (options.fromDate) {
            records = records.filter(
              (record) => new Date(record.dateCreated) >= new Date(options.fromDate)
            );
          }
          if (options.toDate) {
            records = records.filter(
              (record) => new Date(record.dateCreated) <= new Date(options.toDate)
            );
          }
          resolve(records);
        };
        request.onerror = () => {
          reject(new Error("Failed to retrieve evaluations"));
        };
      });
    } catch (error) {
      console.error("Error retrieving evaluations:", error);
      throw error;
    }
  }
  // Find similar cases based on age and concerns
  async findSimilarCases(data, limit = 5) {
    await this.init();
    try {
      const ageInMonths = getAgeInMonths(data.age);
      const minAge = ageInMonths - 12;
      const maxAge = ageInMonths + 12;
      if (this.db instanceof Dexie) {
        return await this.db.evaluations.filter((record) => {
          const evalAgeMonths = getAgeInMonths(record.age);
          return evalAgeMonths >= minAge && evalAgeMonths <= maxAge;
        }).limit(limit).toArray();
      }
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(["evaluations"], "readonly");
        const store = transaction.objectStore("evaluations");
        const request = store.getAll();
        request.onsuccess = () => {
          let records = request.result;
          records = records.filter((record) => {
            const recordAgeMonths = getAgeInMonths(record.age);
            return recordAgeMonths >= minAge && recordAgeMonths <= maxAge;
          });
          if (records.length > limit) {
            records = records.slice(0, limit);
          }
          resolve(records);
        };
        request.onerror = () => {
          reject(new Error("Failed to retrieve similar cases"));
        };
      });
    } catch (error) {
      console.error("Error finding similar cases:", error);
      throw error;
    }
  }
  // Close the database connection
  async close() {
    if (this.db) {
      if (this.db instanceof Dexie) {
        this.db.close();
      } else {
        this.db.close();
      }
      this.db = null;
      this.isInitialized = false;
      this.initPromise = null;
      console.log("Database connection closed");
    }
  }
};
function getAgeInMonths(ageString) {
  if (!ageString) return 0;
  if (typeof ageString === "object" && ageString !== null) {
    const years2 = ageString.years || 0;
    const months = ageString.months || 0;
    return years2 * 12 + months;
  }
  const match = String(ageString).match(/(\d+)\s*years?,?\s*(\d+)?\s*months?/i);
  if (match) {
    const years2 = parseInt(match[1]) || 0;
    const months = parseInt(match[2]) || 0;
    return years2 * 12 + months;
  }
  const years = parseInt(ageString);
  if (!isNaN(years)) {
    return years * 12;
  }
  return 0;
}
var dbManager = new EvaluationDatabase();

// public/assets/js/pdf-generator.js
var PDFGenerator = class {
  constructor() {
    this.previewWindow = null;
    this.formData = null;
  }
  /**
   * Generate a preview of the evaluation that can be edited before PDF generation
   * @param {Object} formData - The form data to use for the preview
   * @returns {Promise<boolean>} - Whether the preview was successfully generated
   */
  async generatePreview(formData) {
    try {
      this.formData = JSON.parse(JSON.stringify(formData));
      if (this.formData.age) {
        const ageMatch = this.formData.age.match(/(\d+)\s*years?,\s*(\d+)\s*months?/i);
        if (ageMatch) {
          this.formData.ageYears = ageMatch[1];
          this.formData.ageMonths = ageMatch[2];
        } else {
          this.formData.ageYears = "0";
          this.formData.ageMonths = "0";
          console.warn("Could not parse age string:", this.formData.age);
        }
      } else if (this.formData.dob && this.formData.evaluationDate) {
        this.calculateAge(this.formData);
      }
      console.log("Initial form data for preview:", this.formData);
      this.previewWindow = window.open("preview.html", "_blank");
      if (!this.previewWindow) {
        throw new Error("Preview window could not be opened. Please allow pop-ups for this site.");
      }
      await new Promise((resolve) => {
        this.previewWindow.addEventListener("load", resolve);
      });
      const sections = this.prepareSections(this.formData);
      console.log("Raw form data:", JSON.stringify(this.formData));
      console.log("Sections prepared for preview:", sections);
      this.previewWindow.postMessage({
        type: "previewData",
        content: {
          ...this.formData,
          firstName: this.formData.firstName || "",
          lastName: this.formData.lastName || "",
          dob: this.formData.dob || "",
          evaluationDate: this.formData.evaluationDate || "",
          ageYears: this.formData.ageYears || "0",
          ageMonths: this.formData.ageMonths || "0",
          sections
        }
      }, "*");
      return true;
    } catch (error) {
      console.error("Error generating preview:", error);
      throw error;
    }
  }
  /**
   * Calculate age from DOB and evaluation date
   * @param {Object} formData - The form data
   * @returns {void}
   */
  calculateAge(formData) {
    const dob = new Date(formData.dob);
    const evalDate = new Date(formData.evaluationDate);
    const ageInMilliseconds = evalDate - dob;
    const ageDate = new Date(Math.abs(ageInMilliseconds));
    const years = Math.abs(ageDate.getUTCFullYear() - 1970);
    const months = ageDate.getUTCMonth();
    formData.ageYears = years.toString();
    formData.ageMonths = months.toString();
  }
  /**
   * Prepare the sections data for the preview
   * @param {Object} formData - The form data
   * @returns {Array} - Array of section objects with id, title, and content
   */
  prepareSections(formData) {
    const sections = [];
    console.log("Preparing sections with form data:", formData);
    const wrapTables = (content) => {
      if (!content || typeof content !== "string") return content;
      if (content.includes("<table")) {
        return content.replace(/<table/g, '<div class="table-wrapper avoid-break"><table').replace(/<\/table>/g, "</table></div>");
      }
      return content;
    };
    sections.push({
      id: "protocolSection",
      title: "Articulation Evaluation Protocol",
      content: this.formatProtocolContent(formData) || "<p>Standard articulation evaluation protocol was followed.</p>"
    });
    sections.push({
      id: "backgroundInfoSection",
      title: "Relevant Background Information",
      content: this.formatBackgroundContent(formData) || "<p>No significant background information reported.</p>"
    });
    sections.push({
      id: "oralMechanismSection",
      title: "Oral Mechanism Evaluation",
      content: this.formatOralMechanismContent(formData) || "<p>Oral mechanism examination was completed.</p>"
    });
    sections.push({
      id: "standardizedAssessmentSection",
      title: "Standardized Assessment",
      content: this.formatStandardizedAssessmentContent(formData) || "<p>The client was assessed using standardized articulation tests.</p>"
    });
    sections.push({
      id: "speechSoundSection",
      title: "Speech Sound Assessment",
      content: this.formatSpeechSoundContent(formData) || "<p>The client was assessed using standardized articulation tests and connected speech samples.</p>"
    });
    sections.push({
      id: "speechSampleSection",
      title: "Speech Sample Analysis",
      content: this.formatSpeechSampleContent(formData) || "<p>Speech samples were collected to analyze articulation skills in conversational speech.</p>"
    });
    let clinicalImpressions = this.formatClinicalImpressionsContent(formData);
    console.log("Clinical impressions content:", clinicalImpressions);
    sections.push({
      id: "clinicalImpressionsSection",
      title: "Clinical Impressions",
      content: clinicalImpressions || "<p>Based on the results of oral mechanism examination and speech sound assessment, the client presents with articulation difficulties that impact speech intelligibility.</p>"
    });
    sections.push({
      id: "recommendationsSection",
      title: "Recommendations",
      content: this.formatRecommendationsContent(formData) || `
                <p>The following recommendations are made based on the results of this evaluation:</p>
                <ol>
                    <li>Speech therapy services are recommended to address articulation errors.</li>
                    <li>A home practice program should be implemented to reinforce skills learned in therapy.</li>
                    <li>Reassessment in 6 months to monitor progress and adjust treatment plan as needed.</li>
                </ol>
            `
    });
    sections.forEach((section) => {
      section.content = wrapTables(section.content);
    });
    return sections;
  }
  /**
   * Extract relevant text content from HTML
   * @param {string} html - The HTML content
   * @returns {string} - Plain text extracted from HTML
   */
  extractTextFromHtml(html) {
    if (!html) return "";
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || "";
  }
  /**
   * Format the protocol content
   * @param {Object} formData - The form data
   * @returns {string} - HTML content for the protocol section
   */
  formatProtocolContent(formData) {
    const clientName = formData.firstName && formData.lastName ? `${formData.firstName} ${formData.lastName}` : "the client";
    let content = `
        <div class="protocol-content">
            <p class="protocol-description">
                An articulation evaluation was conducted to assess ${clientName}'s ability to produce speech
                sounds clearly and appropriately for their age. The purpose of the evaluation is to identify any
                speech sound errors that may affect ability to communicate effectively. Errors in articulation
                can significantly affect ability to be understood, academic performance, and social
                interactions. By understanding specific speech patterns, we can create a tailored intervention
                plan to improve overall communication skills.
            </p>`;
    if (formData.assessmentLanguage) {
      content += `<p><strong>Assessment Language:</strong> ${formData.assessmentLanguage}</p>`;
    }
    content += `
            <div class="components-list">
                <p>The evaluation included the following components:</p>
                <ul>`;
    const components = {
      backgroundInfo: formData.backgroundInfo !== false,
      oralMechanism: formData.oralMechanism !== false,
      speechSound: formData.speechSound !== false,
      speechSample: formData.speechSample !== false
    };
    if (components.backgroundInfo) {
      content += `<li>Collection of Relevant Background Information</li>`;
    }
    if (components.oralMechanism) {
      content += `<li>Oral Mechanism Examination</li>`;
    }
    if (components.speechSound) {
      content += `<li>Speech Sound Assessment</li>`;
    }
    if (components.speechSample) {
      content += `<li>Connected Speech Sample Analysis</li>`;
    }
    if (formData.otherComponentText) {
      content += `<li>Other: ${formData.otherComponentText}</li>`;
    }
    content += `</ul></div>`;
    content += `
            <div class="assessment-summary">
                <p>
                    This thorough process allows us to gain a clear picture of your child's speech strengths and challenges and to make informed recommendations for therapy. All measures were performed in: <strong>${formData.assessmentSummaryLanguage || "Language not specified"}</strong>. Results of all formal and informal assessments appear to be reliable.
                </p>
            </div>
        `;
    content += `</div>`;
    return content;
  }
  /**
   * Format the background information content
   * @param {Object} formData - The form data
   * @returns {string} - HTML content for the background section
   */
  formatBackgroundContent(formData) {
    let content = "<div>";
    let hasBackgroundInfo = false;
    const getValue = (key) => {
      return formData[key] || formData.backgroundInfo && formData.backgroundInfo[key] || null;
    };
    const referralSource = getValue("referralSource");
    if (referralSource) {
      content += `<p><strong>Referral Source:</strong> ${referralSource}</p>`;
      hasBackgroundInfo = true;
    }
    const referralReason = getValue("referralReason");
    if (referralReason) {
      content += `<p><strong>Reason for Referral:</strong> ${referralReason}</p>`;
      hasBackgroundInfo = true;
    }
    const medicalHistory = getValue("medicalHistory") || getValue("medicalHistoryNotes");
    if (medicalHistory) {
      content += `<p><strong>Medical History:</strong> ${medicalHistory}</p>`;
      hasBackgroundInfo = true;
    }
    const developmentalHistory = getValue("developmentalHistory") || getValue("developmentalHistoryNotes");
    if (developmentalHistory) {
      content += `<p><strong>Developmental History:</strong> ${developmentalHistory}</p>`;
      hasBackgroundInfo = true;
    }
    const previousEvaluations = getValue("previousEvaluations") || getValue("previousEvaluationsNotes");
    if (previousEvaluations) {
      content += `<p><strong>Previous Evaluations:</strong> ${previousEvaluations}</p>`;
      hasBackgroundInfo = true;
    }
    const currentServices = getValue("currentServices") || getValue("currentServicesNotes");
    if (currentServices) {
      content += `<p><strong>Current Services:</strong> ${currentServices}</p>`;
      hasBackgroundInfo = true;
    } else if (getValue("serviceHistory")) {
      content += `<p><strong>Service History:</strong> ${getValue("serviceHistory")}</p>`;
      hasBackgroundInfo = true;
    }
    const languageHistory = getValue("languageHistory");
    if (languageHistory) {
      content += `<p><strong>Language History:</strong> ${languageHistory}</p>`;
      hasBackgroundInfo = true;
    }
    console.log("Background info content:", content, "Has background info:", hasBackgroundInfo);
    if (!hasBackgroundInfo) {
      content += "<p>No significant background information reported.</p>";
    }
    content += "</div>";
    return content;
  }
  /**
   * Format the oral mechanism content
   * @param {Object} formData - The form data
   * @returns {string} - HTML content for the oral mechanism section
   */
  formatOralMechanismContent(formData) {
    let content = "<div>";
    content += `<p>The oral mechanism examination was conducted to assess structural and functional characteristics of the articulators that may impact speech production.</p>`;
    let hasStructureData = false;
    let structureContent = `
            <h4>Structure Assessment</h4>
            <table>
                <tr>
                    <th>Structure</th>
                    <th>Observations</th>
                </tr>
        `;
    const structures = [
      { name: "Face", field: "face" },
      { name: "Mandible/Maxilla", field: "mandible" },
      { name: "Teeth", field: "teeth" },
      { name: "Palatal", field: "palatal" },
      { name: "Lips", field: "lips" }
    ];
    structures.forEach((structure) => {
      let observation = "";
      let hasData = false;
      if (formData.oralMechanism && formData.oralMechanism.structure) {
        const wnl = formData.oralMechanism.structure[`${structure.field}WNL`];
        const concern = formData.oralMechanism.structure[`${structure.field}Concern`];
        if (wnl !== void 0 || concern !== void 0) {
          hasData = true;
          hasStructureData = true;
          if (wnl) observation = "Within normal limits";
          if (concern) observation = "Area of concern";
        }
      }
      if (formData[structure.field]) {
        if (observation) observation += "; ";
        observation += formData[structure.field];
        hasData = true;
        hasStructureData = true;
      }
      if (hasData) {
        structureContent += `
                    <tr>
                        <td>${structure.name}</td>
                        <td>${observation}</td>
                    </tr>
                `;
      }
    });
    structureContent += "</table>";
    if (formData.oralMechanism && formData.oralMechanism.structure && formData.oralMechanism.structure.structureNotes) {
      structureContent += `<p><strong>Structure Notes:</strong> ${formData.oralMechanism.structure.structureNotes}</p>`;
      hasStructureData = true;
    }
    if (hasStructureData) {
      content += structureContent;
    }
    let hasFunctionData = false;
    let functionContent = `
            <h4>Function Assessment</h4>
            <table>
                <tr>
                    <th>Function</th>
                    <th>Observations</th>
                </tr>
        `;
    const functions = [
      { name: "Jaw Movement", field: "jaw" },
      { name: "Velopharyngeal Function", field: "velopharyngeal" },
      { name: "Phonation/Breath Support", field: "phonation" },
      { name: "Oral Reflexes", field: "reflexes" },
      { name: "Motor Speech Coordination", field: "motor" }
    ];
    functions.forEach((func) => {
      let observation = "";
      let hasData = false;
      if (formData.oralMechanism && formData.oralMechanism.function) {
        const wnl = formData.oralMechanism.function[`${func.field}WNL`];
        const concern = formData.oralMechanism.function[`${func.field}Concern`];
        if (wnl !== void 0 || concern !== void 0) {
          hasData = true;
          hasFunctionData = true;
          if (wnl) observation = "Within normal limits";
          if (concern) observation = "Area of concern";
        }
      }
      if (formData[func.field]) {
        if (observation) observation += "; ";
        observation += formData[func.field];
        hasData = true;
        hasFunctionData = true;
      }
      if (hasData) {
        functionContent += `
                    <tr>
                        <td>${func.name}</td>
                        <td>${observation}</td>
                    </tr>
                `;
      }
    });
    functionContent += "</table>";
    if (formData.oralMechanism && formData.oralMechanism.function && formData.oralMechanism.function.functionNotes) {
      functionContent += `<p><strong>Function Notes:</strong> ${formData.oralMechanism.function.functionNotes}</p>`;
      hasFunctionData = true;
    }
    if (hasFunctionData) {
      content += functionContent;
    }
    if (formData.diadochokinetic) {
      content += `<p><strong>Diadochokinetic Rates:</strong> ${formData.diadochokinetic}</p>`;
    }
    if (formData.structureNotes) {
      content += `<p><strong>Structure Notes:</strong> ${formData.structureNotes}</p>`;
    }
    if (formData.functionNotes) {
      content += `<p><strong>Function Notes:</strong> ${formData.functionNotes}</p>`;
    }
    if (formData.oralMechanism && formData.oralMechanism.overallNotes) {
      content += `<p><strong>Overall Assessment:</strong> ${formData.oralMechanism.overallNotes}</p>`;
    }
    content += "</div>";
    return content;
  }
  /**
   * Format the standardized assessment content
   * @param {Object} formData - The form data
   * @returns {string} - HTML content for the standardized assessment section
   */
  formatStandardizedAssessmentContent(formData) {
    if (!formData.standardizedAssessment && !formData.assessmentResults && !formData.ac_standard_score && !formData.ec_standard_score && !formData.tl_standard_score) {
      return `
                <div><p>The client was assessed using standardized articulation tests to evaluate speech sound production skills.</p></div>
            `;
    }
    let content = "<div>";
    if (typeof formData.standardizedAssessment === "string" && formData.standardizedAssessment) {
      content += `<p>${formData.standardizedAssessment}</p>`;
    }
    if (formData.assessmentResults) {
      if (Array.isArray(formData.assessmentResults)) {
        content += "<table><tr><th>Assessment</th><th>Score</th><th>Interpretation</th></tr>";
        formData.assessmentResults.forEach((result) => {
          content += `
                        <tr>
                            <td>${result.name || ""}</td>
                            <td>${result.score || ""}</td>
                            <td>${result.interpretation || ""}</td>
                        </tr>
                    `;
        });
        content += "</table>";
      } else {
        content += `<p>${formData.assessmentResults}</p>`;
      }
    } else if (typeof formData.standardizedAssessment === "object" && formData.standardizedAssessment) {
      content += "<table><tr><th>Assessment</th><th>Standard Score</th><th>Severity</th></tr>";
      const subtests = {
        ac: { name: "Auditory Comprehension", score: "ac_standard_score", severity: "ac_severity" },
        ec: { name: "Expressive Communication", score: "ec_standard_score", severity: "ec_severity" },
        tl: { name: "Total Language", score: "tl_standard_score", severity: "tl_severity" }
      };
      Object.entries(subtests).forEach(([key, subtest]) => {
        const score = formData[subtest.score] || (formData.standardizedAssessment[key] ? formData.standardizedAssessment[key].standardScore : null);
        if (!score) return;
        const severity = formData[subtest.severity] || (formData.standardizedAssessment[key] ? formData.standardizedAssessment[key].severity : "");
        content += `
                    <tr>
                        <td>${subtest.name}</td>
                        <td>${score}</td>
                        <td>${severity || ""}</td>
                    </tr>
                `;
      });
      content += "</table>";
      if (formData.standardizedAssessmentNotes) {
        content += `<p>${formData.standardizedAssessmentNotes}</p>`;
      } else if (formData.assessmentNotes) {
        content += `<p>${formData.assessmentNotes}</p>`;
      }
      content += `<p>Standard scores are based on a scale with a mean of 100 and a standard deviation of +/- 15.</p>`;
    }
    content += "</div>";
    return content;
  }
  /**
   * Format the speech sound content
   * @param {Object} formData - The form data
   * @returns {string} - HTML content for the speech sound section
   */
  formatSpeechSoundContent(formData) {
    if (!formData.speechSoundIntro && !formData.speechSoundErrors && !formData.phonologicalProcesses && (!formData.speechSound || Object.keys(formData.speechSound || {}).length === 0)) {
      return `
                <div><p>The client was assessed using standardized articulation tests and connected speech samples to evaluate speech sound production skills.</p></div>
            `;
    }
    let content = "<div>";
    if (formData.speechSoundIntro) {
      content += `<p>${formData.speechSoundIntro}</p>`;
    } else {
      content += `<p>Speech Sound Assessment: The ability to produce speech sounds was assessed throughout 
            the course of the evaluation in order to measure articulation of sounds and determine types of misarticulation. The Clinical Assessment of Articulation and Phonology - 2nd Edition (CAAP-2) was administered. Additionally, spontaneous speech was elicited both in words and connected speech. Data was collected and analyzed using the Age of Customary Consonant Production chart as recommended by The American Speech-Language-Hearing Association (ASHA). The acquisition of speech sounds is a developmental process and children often demonstrate "typical" errors and phonological patterns during this acquisition period. Developmentally appropriate error patterns were taken into consideration during assessment of speech sounds in order to differentiate typical errors from those that are not.</p>`;
    }
    if (formData.speechSound && formData.speechSound.articulation) {
      if (formData.speechSound.articulation.errorPatterns && formData.speechSound.articulation.errorPatterns.length > 0) {
        content += `
                    <h4>Speech Sound Errors</h4>
                    <table>
                        <tr>
                            <th>Sound</th>
                            <th>Error Type</th>
                            <th>Position</th>
                            <th>Details</th>
                        </tr>
                `;
        formData.speechSound.articulation.errorPatterns.forEach((error) => {
          content += `
                        <tr>
                            <td>${error.sound || ""}</td>
                            <td>${error.substitution || ""}</td>
                            <td>${error.positions ? error.positions.join(", ") : ""}</td>
                            <td>${error.detail || ""}</td>
                        </tr>
                    `;
        });
        content += "</table>";
      }
    }
    content += `
            <h4>Sound Assessment Table</h4>
            <table>
                <tr>
                    <th>Sound</th>
                    <th>Status</th>
                    <th>Position</th>
                    <th>Error Type</th>
                    <th>Notes</th>
                </tr>
        `;
    const allSounds = [
      { symbol: "/p/", id: "p" },
      { symbol: "/b/", id: "b" },
      { symbol: "/t/", id: "t" },
      { symbol: "/d/", id: "d" },
      { symbol: "/k/", id: "k" },
      { symbol: "/g/", id: "g" },
      { symbol: "/f/", id: "f" },
      { symbol: "/v/", id: "v" },
      { symbol: "/s/", id: "s" },
      { symbol: "/z/", id: "z" },
      { symbol: "/sh/", id: "sh" },
      { symbol: "/ch/", id: "ch" },
      { symbol: "/j/", id: "j" },
      { symbol: "/th/ (voiced)", id: "th_voiced" },
      { symbol: "/th/ (voiceless)", id: "th_voiceless" },
      { symbol: "/r/", id: "r" },
      { symbol: "/l/", id: "l" },
      { symbol: "/w/", id: "w" },
      { symbol: "/y/", id: "y" },
      { symbol: "/h/", id: "h" },
      { symbol: "/m/", id: "m" },
      { symbol: "/n/", id: "n" },
      { symbol: "/ng/", id: "ng" }
    ];
    allSounds.forEach((sound) => {
      let status = "Correct";
      let position = "";
      let errorType = "";
      let notes = "";
      if (formData.speechSound?.articulation?.errorPatterns) {
        const errorPattern = formData.speechSound.articulation.errorPatterns.find(
          (error) => error.sound === sound.symbol || error.sound === `/${sound.id}/`
        );
        if (errorPattern) {
          status = "Misarticulated";
          position = errorPattern.positions ? errorPattern.positions.join(", ") : "";
          errorType = errorPattern.substitution || "";
          notes = errorPattern.detail || "";
        }
      }
      const soundChecked = formData[`sound_${sound.id}`] === true || formData[`sound_${sound.id}_misarticulated`] === true;
      if (soundChecked) {
        status = "Misarticulated";
        position = formData[`sound_${sound.id}_position`] || "";
        errorType = formData[`sound_${sound.id}_type`] || "";
        notes = formData[`sound_${sound.id}_detail`] || "";
      }
      content += `
                <tr>
                    <td>${sound.symbol}</td>
                    <td>${status}</td>
                    <td>${position}</td>
                    <td>${errorType}</td>
                    <td>${notes}</td>
                </tr>
            `;
    });
    content += "</table>";
    if (formData.speechSound && formData.speechSound.intelligibility) {
      content += "<h4>Speech Intelligibility</h4>";
      content += "<p><strong>Intelligibility Assessment:</strong></p>";
      if (formData.speechSound.intelligibility.intelligibilityNotes) {
        content += `<p>${formData.speechSound.intelligibility.intelligibilityNotes}</p>`;
      }
    }
    if (formData.speechSoundErrors && Array.isArray(formData.speechSoundErrors)) {
      content += `
                <table>
                    <tr>
                        <th>Sound</th>
                        <th>Initial</th>
                        <th>Medial</th>
                        <th>Final</th>
                    </tr>
            `;
      formData.speechSoundErrors.forEach((error) => {
        content += `
                    <tr>
                        <td>${error.sound || ""}</td>
                        <td>${error.initial || ""}</td>
                        <td>${error.medial || ""}</td>
                        <td>${error.final || ""}</td>
                    </tr>
                `;
      });
      content += "</table>";
    }
    if (formData.phonologicalProcesses) {
      content += `
                <p><strong>Phonological Processes:</strong> ${formData.phonologicalProcesses}</p>
            `;
    }
    if (formData.speechSound?.overallNotes) {
      content += `<p>${formData.speechSound.overallNotes}</p>`;
    }
    if (formData.speechSoundNotes && !content.includes(formData.speechSoundNotes)) {
      content += `<p>${formData.speechSoundNotes}</p>`;
    }
    content += "</div>";
    return content;
  }
  /**
   * Format the speech sample content
   * @param {Object} formData - The form data
   * @returns {string} - HTML content for the speech sample section
   */
  formatSpeechSampleContent(formData) {
    let content = "<div>";
    if (formData.speechSample) {
      content += `<p>${formData.speechSample}</p>`;
    } else if (formData.languageSample?.observations) {
      content += `<p>${formData.languageSample.observations}</p>`;
    } else {
      content += `
                <p>A speech sample was collected during spontaneous conversation, play-based activities, and 
                picture description tasks to assess articulation and intelligibility in connected speech. The 
                following observations were made:</p>
            `;
    }
    content += `<h4>Sound Production</h4>`;
    let soundObservations = [];
    if (formData.accurateProduction) {
      soundObservations.push("Accurate production of sounds observed.");
    }
    if (formData.substitutionErrors) {
      soundObservations.push("Substitution errors noted in conversation.");
    }
    if (formData.omissionErrors) {
      soundObservations.push("Omission of sounds observed in conversation.");
    }
    if (formData.distortionErrors) {
      soundObservations.push("Distortion of sounds noted in conversation.");
    }
    if (formData.additionErrors) {
      soundObservations.push("Addition of sounds observed in conversation.");
    }
    if (formData.otherSoundProduction && formData.otherSoundProductionText) {
      soundObservations.push(`Other: ${formData.otherSoundProductionText}`);
    }
    if (soundObservations.length === 0) {
      content += `<p>Analysis of sound production in connected speech was conducted to identify any articulation errors.</p>`;
    } else {
      content += `<ul>`;
      soundObservations.forEach((observation) => {
        content += `<li>${observation}</li>`;
      });
      content += `</ul>`;
    }
    content += `<h4>Phonological Patterns</h4>`;
    let phonologicalPatterns = [];
    if (formData.clusterReduction) {
      phonologicalPatterns.push("Cluster reduction");
    }
    if (formData.finalConsonantDeletion) {
      phonologicalPatterns.push("Final consonant deletion");
    }
    if (formData.weakSyllableDeletion) {
      phonologicalPatterns.push("Weak syllable deletion");
    }
    if (formData.frontingSounds) {
      phonologicalPatterns.push("Fronting of sounds");
    }
    if (formData.glidingLiquids) {
      phonologicalPatterns.push("Gliding of liquids");
    }
    if (formData.stopping) {
      phonologicalPatterns.push("Stopping");
    }
    if (formData.otherPattern && formData.otherPatternText) {
      phonologicalPatterns.push(`Other: ${formData.otherPatternText}`);
    }
    if (phonologicalPatterns.length === 0) {
      content += `<p>Analysis of phonological patterns in connected speech was conducted.</p>`;
    } else {
      content += `<p>The following phonological patterns were observed:</p>`;
      content += `<ul>`;
      phonologicalPatterns.forEach((pattern) => {
        content += `<li>${pattern}</li>`;
      });
      content += `</ul>`;
    }
    if (formData.phonologicalNotes) {
      content += `<p>${formData.phonologicalNotes}</p>`;
    }
    content += `<h4>Speech Intelligibility</h4>`;
    let familiarIntelligibility = "Not assessed";
    if (formData.familiarHigh) {
      familiarIntelligibility = "Highly intelligible (90\u2013100%)";
    } else if (formData.familiarModerate) {
      familiarIntelligibility = "Moderately intelligible (70\u201389%)";
    } else if (formData.familiarPoor) {
      familiarIntelligibility = "Poor intelligibility (50\u201369%)";
    } else if (formData.familiarVeryPoor) {
      familiarIntelligibility = "Very poor intelligibility (<50%)";
    }
    let unfamiliarIntelligibility = "Not assessed";
    if (formData.unfamiliarHigh) {
      unfamiliarIntelligibility = "Highly intelligible (90\u2013100%)";
    } else if (formData.unfamiliarModerate) {
      unfamiliarIntelligibility = "Moderately intelligible (70\u201389%)";
    } else if (formData.unfamiliarPoor) {
      unfamiliarIntelligibility = "Poor intelligibility (50\u201369%)";
    } else if (formData.unfamiliarVeryPoor) {
      unfamiliarIntelligibility = "Very poor intelligibility (<50%)";
    }
    content += `
            <p><strong>Familiar Listeners:</strong> ${familiarIntelligibility}</p>
            <p><strong>Unfamiliar Listeners:</strong> ${unfamiliarIntelligibility}</p>
        `;
    if (formData.intelligibilityNotes) {
      content += `<p>${formData.intelligibilityNotes}</p>`;
    }
    content += `<h4>Connected Speech Characteristics</h4>`;
    let speechCharacteristics = [];
    if (formData.speechOrganized) {
      speechCharacteristics.push("Speech is organized and fluent.");
    }
    if (formData.speechDisorganized) {
      speechCharacteristics.push("Disorganized speech noted (e.g., frequent pauses, hesitations).");
    }
    if (formData.speechRateNormal) {
      speechCharacteristics.push("Speech rate is within normal limits.");
    }
    if (formData.speechRateSlow) {
      speechCharacteristics.push("Speech rate is slow, impacting clarity.");
    }
    if (formData.speechRateFast) {
      speechCharacteristics.push("Speech rate is fast, impacting clarity.");
    }
    if (formData.selfCorrections) {
      speechCharacteristics.push("Self-corrections observed.");
    }
    if (formData.otherCharacteristic && formData.otherCharacteristicText) {
      speechCharacteristics.push(`Other: ${formData.otherCharacteristicText}`);
    }
    if (speechCharacteristics.length === 0) {
      content += `<p>Analysis of connected speech characteristics was conducted.</p>`;
    } else {
      content += `<ul>`;
      speechCharacteristics.forEach((characteristic) => {
        content += `<li>${characteristic}</li>`;
      });
      content += `</ul>`;
    }
    if (formData.characteristicsNotes) {
      content += `<p>${formData.characteristicsNotes}</p>`;
    }
    content += `<h4>Strengths Observed</h4>`;
    let strengths = [];
    if (formData.varietySentences) {
      strengths.push("Variety of sentence structures used.");
    }
    if (formData.ageVocabulary) {
      strengths.push("Age-appropriate vocabulary observed.");
    }
    if (formData.selfCorrectEfforts) {
      strengths.push("Efforts to self-correct noted.");
    }
    if (formData.otherStrength && formData.otherStrengthText) {
      strengths.push(`Other: ${formData.otherStrengthText}`);
    }
    if (strengths.length === 0) {
      content += `<p>Assessment of communication strengths was conducted.</p>`;
    } else {
      content += `<ul>`;
      strengths.forEach((strength) => {
        content += `<li>${strength}</li>`;
      });
      content += `</ul>`;
    }
    content += "</div>";
    return content;
  }
  /**
   * Format the clinical impressions content
   * @param {Object} formData - The form data
   * @returns {string} - HTML content for the clinical impressions section
   */
  formatClinicalImpressionsContent(formData) {
    let content = "<div>";
    if (formData.clinicalImpressionsSummary) {
      if (typeof formData.clinicalImpressionsSummary === "string") {
        formData.clinicalImpressionsSummary = formData.clinicalImpressionsSummary.replace(/\s+/g, " ").trim();
      }
      content += formData.clinicalImpressionsSummary;
    } else if (formData.clinicalImpressionsText) {
      content += formData.clinicalImpressionsText;
    } else {
      const summary = formData.summary || formData.clinicalSummary || formData.impressionsSummary;
      if (summary) {
        content += `<p>${summary}</p>`;
      }
      try {
        if (window.templateEngine && typeof window.templateEngine.render === "function") {
          content += window.templateEngine.render("clinicalImpressions", { ...formData, generateForPDF: true, naturalText: true });
        } else {
          content += "<p>Based on the results of this evaluation, the client presents with articulation difficulties that impact speech intelligibility.</p>";
        }
      } catch (error) {
        console.error("Error rendering clinical impressions template:", error);
        content += "<p>Based on the results of this evaluation, the client presents with articulation difficulties that impact speech intelligibility.</p>";
        content += "<p>Prognosis for improvement is favorable with speech therapy intervention.</p>";
      }
    }
    content = content.replace(/<p>\s*<\/p>/g, "");
    content = content.replace(/>\s+</g, "> <");
    content += "</div>";
    return content;
  }
  /**
   * Format the recommendations content
   * @param {Object} formData - The form data
   * @returns {string} - HTML content for the recommendations section
   */
  formatRecommendationsContent(formData) {
    if (!formData.recommendationsSummary && !formData.recommendations) {
      return this.getDefaultRecommendations();
    }
    let content = "<div>";
    if (formData.recommendationsSummary) {
      content += formData.recommendationsSummary;
    } else if (formData.recommendations) {
      if (typeof formData.recommendations === "string") {
        content += formData.recommendations;
      } else if (Array.isArray(formData.recommendations)) {
        content += "<ol>" + formData.recommendations.map((rec) => `<li>${rec}</li>`).join("") + "</ol>";
      }
    } else {
      try {
        if (window.templateEngine && typeof window.templateEngine.render === "function") {
          content += window.templateEngine.render("recommendations", { ...formData, naturalText: true });
        } else {
          content += `
                        <p>The following recommendations are made based on the results of this evaluation:</p>
                        <ol>
                            <li>Speech therapy services are recommended to address articulation errors.</li>
                            <li>A home practice program should be implemented to reinforce skills learned in therapy.</li>
                            <li>Reassessment in 6 months to monitor progress and adjust treatment plan as needed.</li>
                        </ol>
                    `;
        }
      } catch (error) {
        console.error("Error rendering recommendations template:", error);
        content += `
                    <p>The following recommendations are made based on the results of this evaluation:</p>
                    <ol>
                        <li>Speech therapy services are recommended to address articulation errors.</li>
                        <li>A home practice program should be implemented to reinforce skills learned in therapy.</li>
                        <li>Reassessment in 6 months to monitor progress and adjust treatment plan as needed.</li>
                    </ol>
                `;
      }
    }
    content += "</div>";
    return content;
  }
  /**
   * Get default recommendations content
   * @returns {string} - HTML content with default recommendations
   */
  getDefaultRecommendations() {
    let content = "<div>";
    content += `
            <p>The following recommendations are made based on the results of this evaluation:</p>
            <ol>
                <li>Speech therapy services are recommended to address articulation errors.</li>
                <li>A home practice program should be implemented to reinforce skills learned in therapy.</li>
                <li>Reassessment in 6 months to monitor progress and adjust treatment plan as needed.</li>
            </ol>
        `;
    content += "</div>";
    return content;
  }
};
function createPDFGenerator() {
  return new PDFGenerator();
}

// public/assets/js/summary-generator.js
init_template_engine();
async function generateSummary(formData, useAI = true) {
  try {
    if (useAI) {
      console.log("Attempting AI-powered summary generation...");
      const aiSummary = await generateAISummary(formData);
      if (aiSummary && aiSummary.success) {
        console.log("AI summary generated successfully");
        return aiSummary.summary;
      } else {
        console.warn("AI summary generation failed, falling back to template-based generation:", aiSummary);
      }
    }
    console.log("Using template-based summary generation...");
    let sampleEvaluations = [];
    try {
      sampleEvaluations = await dbManager.findSimilarCases(formData, 10);
      if (sampleEvaluations.length < 3) {
        sampleEvaluations = await dbManager.getAllEvaluations();
      }
      console.log(`Found ${sampleEvaluations.length} sample evaluations for comparison`);
    } catch (err) {
      console.warn("Could not load sample evaluations, using empty set:", err);
    }
    if (!formData || typeof formData !== "object" || !formData.firstName) {
      console.error("Invalid or incomplete form data:", formData);
      throw new Error("Invalid form data provided");
    }
    let enhancedData = await enhanceWithSampleData(formData, sampleEvaluations);
    enhancedData = await enhanceWithArticulationInfo(enhancedData);
    enhancedData = ensureAllSectionsIncluded(enhancedData);
    const isForPDF = enhancedData.generateForPDF === true;
    if (enhancedData.clinicalImpressionsText && !isForPDF) {
      return enhancedData.clinicalImpressionsText;
    }
    let summary = "";
    summary += templateEngine.render("clinicalImpressions", enhancedData);
    if (isForPDF) {
      summary += "\n\n";
      summary += templateEngine.render("recommendations", enhancedData);
    }
    return summary.trim();
  } catch (error) {
    console.error("Error generating summary:", error);
    console.error("Error stack:", error);
    return `Error generating summary: ${error.message}. Please try again.`;
  }
}
async function generateAISummary(formData) {
  try {
    const token = getAuthToken();
    if (!token) {
      console.warn("No authentication token found for AI summary generation");
      return { success: false, error: "Authentication required" };
    }
    const clinicalData = prepareClinicalData(formData);
    const response = await fetch("/api/ai/summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        formData: clinicalData,
        requestType: "clinical_summary",
        options: {
          includeRecommendations: false,
          focusAreas: ["clinical_impressions", "assessment_results"],
          clinicalContext: "speech_language_pathology"
        }
      })
    });
    if (!response.ok) {
      throw new Error(`AI API responded with status ${response.status}: ${response.statusText}`);
    }
    const result = await response.json();
    if (result.success && result.summary) {
      return {
        success: true,
        summary: result.summary,
        metadata: result.metadata || {}
      };
    } else {
      return {
        success: false,
        error: result.error || "Unknown error from AI service"
      };
    }
  } catch (error) {
    console.error("Error in AI summary generation:", error);
    return {
      success: false,
      error: error.message
    };
  }
}
function getAuthToken() {
  let token = localStorage.getItem("authToken") || localStorage.getItem("token") || sessionStorage.getItem("authToken") || sessionStorage.getItem("token");
  if (!token) {
    const cookies = document.cookie.split(";");
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split("=");
      if (name === "authToken" || name === "token") {
        token = value;
        break;
      }
    }
  }
  return token;
}
function prepareClinicalData(formData) {
  return {
    // Patient Demographics
    patientInfo: {
      name: `${formData.firstName || ""} ${formData.lastName || ""}`.trim(),
      age: formData.age,
      dateOfBirth: formData.dateOfBirth,
      evaluationDate: formData.evaluationDate
    },
    // Assessment Data
    assessmentData: {
      standardizedAssessment: formData.standardizedAssessment,
      speechSound: formData.speechSound,
      oralMechanism: formData.oralMechanism,
      speechSample: formData.speechSample,
      languageSample: formData.languageSample,
      backgroundInfo: formData.backgroundInfo
    },
    // Clinical Context
    clinicalContext: {
      referralSource: formData.referralSource,
      reasonForReferral: formData.reasonForReferral,
      evaluator: formData.evaluator
    },
    // Extract key findings for AI processing
    keyFindings: extractKeyFindings(formData)
  };
}
function extractKeyFindings(formData) {
  const findings = {};
  if (formData.standardizedAssessment) {
    const { tl, ac, ec } = formData.standardizedAssessment;
    if (tl && tl.standardScore) {
      findings.totalLanguageScore = {
        score: tl.standardScore,
        percentile: tl.percentile,
        severity: tl.severity
      };
    }
    if (ac && ac.standardScore) {
      findings.auditoryComprehension = {
        score: ac.standardScore,
        severity: ac.severity
      };
    }
    if (ec && ec.standardScore) {
      findings.expressiveCommunication = {
        score: ec.standardScore,
        severity: ec.severity
      };
    }
  }
  if (formData.speechSound) {
    findings.speechSound = {
      articulation: formData.speechSound.articulation,
      intelligibility: formData.speechSound.intelligibility,
      phonologicalProcesses: extractPhonologicalProcesses(formData.speechSound)
    };
  }
  if (formData.oralMechanism) {
    findings.oralMechanism = {
      structure: formData.oralMechanism.structure,
      function: formData.oralMechanism.function,
      overallFindings: formData.oralMechanism.overallNotes
    };
  }
  if (formData.speechSample && formData.speechSample.observations) {
    findings.speechObservations = formData.speechSample.observations;
  }
  if (formData.languageSample && formData.languageSample.observations) {
    findings.languageObservations = formData.languageSample.observations;
  }
  return findings;
}
function extractPhonologicalProcesses(speechSoundData) {
  const processes = [];
  if (speechSoundData.articulation && speechSoundData.articulation.errorPatterns) {
    speechSoundData.articulation.errorPatterns.forEach((pattern) => {
      if (pattern.sound && pattern.substitution) {
        processes.push({
          target: pattern.sound,
          substitution: pattern.substitution,
          positions: pattern.positions || []
        });
      }
    });
  }
  return processes;
}
function ensureAllSectionsIncluded(formData) {
  const enhancedData = { ...formData };
  const sectionChecks = [
    { key: "speechSample", check: (data) => data.speechSample && typeof data.speechSample === "object" },
    { key: "languageSample", check: (data) => data.languageSample && typeof data.languageSample === "object" },
    { key: "oralMechanism", check: (data) => data.oralMechanism && typeof data.oralMechanism === "object" },
    { key: "speechSound", check: (data) => data.speechSound && typeof data.speechSound === "object" },
    { key: "backgroundInfo", check: (data) => data.backgroundInfo && typeof data.backgroundInfo === "object" },
    { key: "standardizedAssessment", check: (data) => data.standardizedAssessment && typeof data.standardizedAssessment === "object" }
  ];
  sectionChecks.forEach(({ key, check }) => {
    if (check(formData) && !enhancedData[`${key}Analysis`]) {
      console.log(`Ensuring section ${key} is included in summary`);
      switch (key) {
        case "speechSample":
          enhancedData.speechSampleAnalysis = {
            observations: formData.speechSample.observations,
            analyzed: true
          };
          break;
        case "languageSample":
          enhancedData.languageSampleAnalysis = {
            observations: formData.languageSample.observations,
            analyzed: true
          };
          break;
        case "oralMechanism":
          if (!enhancedData.oralMechanismAnalysis) {
            enhancedData.oralMechanismAnalysis = { ...formData.oralMechanism, analyzed: true };
          }
          break;
        case "speechSound":
          if (!enhancedData.speechSoundAnalysis) {
            enhancedData.speechSoundAnalysis = { ...formData.speechSound, analyzed: true };
          }
          break;
        case "backgroundInfo":
          if (!enhancedData.backgroundInfoAnalysis) {
            enhancedData.backgroundInfoAnalysis = { ...formData.backgroundInfo, analyzed: true };
          }
          break;
        case "standardizedAssessment":
          break;
      }
    }
  });
  return enhancedData;
}
async function enhanceWithArticulationInfo(formData) {
  try {
    const articulationInfo = await dbManager.getEvaluation("articulation_evaluation_info").catch(() => null);
    if (articulationInfo && articulationInfo.content) {
      return {
        ...formData,
        articulationInfo: {
          sections: articulationInfo.content.sections,
          standardizedTests: articulationInfo.content.standardizedTests,
          techniques: articulationInfo.content.techniques,
          phonologicalProcesses: articulationInfo.content.phonologicalProcesses,
          clinicalImpressionEnhancements: articulationInfo.content.clinicalImpressionEnhancements
        }
      };
    }
    return formData;
  } catch (error) {
    console.error("Error enhancing with articulation info:", error);
    return formData;
  }
}
async function enhanceWithSampleData(formData, sampleEvaluations) {
  const enhancedData = { ...formData };
  if (sampleEvaluations && sampleEvaluations.length > 0) {
    const similarCases = findSimilarCases(formData, sampleEvaluations);
    enhancedData.similarCases = similarCases;
    enhancedData.backgroundInfo = enhanceBackgroundInfo(formData, similarCases);
    enhancedData.commonPatterns = extractCommonPatterns(similarCases);
    enhancedData.scoreAnalysis = analyzeScores(formData, sampleEvaluations);
    enhancedData.oralMechanismAnalysis = analyzeOralMechanism(formData, similarCases);
    enhancedData.speechSoundAnalysis = analyzeSpeechSound(formData, similarCases);
    enhancedData.speechSampleAnalysis = analyzeSpeechSample(formData, similarCases);
    enhancedData.languageSampleAnalysis = analyzeLanguageSample(formData, similarCases);
    enhancedData.prognosisEvidence = generatePrognosisWithEvidence(formData, sampleEvaluations);
    enhancedData.articulationAnalysis = analyzeArticulation(formData, similarCases);
    enhancedData.sampleInsights = extractInsightsFromSamples(similarCases);
  }
  return enhancedData;
}
function findSimilarCases(currentData, sampleEvaluations) {
  return sampleEvaluations.filter((sample) => {
    try {
      const ageDiff = Math.abs(getAgeInMonths2(sample.age) - getAgeInMonths2(currentData.age));
      if (ageDiff > 12) return false;
      return hasMatchingConcerns(currentData, sample);
    } catch (error) {
      console.warn("Error comparing cases:", error);
      return false;
    }
  });
}
function getAgeInMonths2(ageString) {
  if (!ageString) return 0;
  if (typeof ageString === "object" && ageString !== null) {
    const years2 = ageString.years || 0;
    const months = ageString.months || 0;
    return years2 * 12 + months;
  }
  const match = String(ageString).match(/(\d+)\s*years?,?\s*(\d+)?\s*months?/i);
  if (match) {
    const years2 = parseInt(match[1]) || 0;
    const months = parseInt(match[2]) || 0;
    return years2 * 12 + months;
  }
  const years = parseInt(ageString);
  if (!isNaN(years)) {
    return years * 12;
  }
  return 0;
}
function hasMatchingConcerns(data1, data2) {
  try {
    const concerns1 = extractConcerns(data1);
    const concerns2 = extractConcerns(data2);
    return concerns1.some((concern) => concerns2.includes(concern));
  } catch (error) {
    console.warn("Error comparing concerns:", error);
    return false;
  }
}
function extractConcerns(data) {
  const concerns = [];
  try {
    if (data.speechSound) {
      if (data.speechSound.articulation && data.speechSound.articulation.errorPatterns) {
        const errorPatterns = data.speechSound.articulation.errorPatterns;
        if (Array.isArray(errorPatterns)) {
          errorPatterns.forEach((pattern) => {
            if (pattern.substitution) concerns.push("substitution");
            if (pattern.sound && !pattern.substitution) concerns.push("omission");
          });
        }
      }
      if (data.substitutionErrors) concerns.push("substitution");
      if (data.omissionErrors) concerns.push("omission");
      if (data.distortionErrors) concerns.push("distortion");
    }
    if (data.languageSample && data.languageSample.observations) {
      concerns.push("language");
    }
    if (data.oralMechanism) {
      const structure = data.oralMechanism.structure || {};
      const functionData = data.oralMechanism.function || {};
      if (structure.faceConcern || structure.mandibleConcern || structure.teethConcern || structure.palatalConcern || structure.lipsConcern) {
        concerns.push("oral-structure");
      }
      if (functionData.jawConcern || functionData.velopharyngealConcern || functionData.phonationConcern || functionData.reflexesConcern || functionData.motorConcern) {
        concerns.push("oral-function");
      }
    }
  } catch (error) {
    console.warn("Error extracting concerns:", error);
  }
  return concerns;
}
function extractInsightsFromSamples(cases) {
  if (!cases || cases.length === 0) return null;
  const insights = {
    commonObservations: /* @__PURE__ */ new Set(),
    commonRecommendations: /* @__PURE__ */ new Set(),
    commonTreatmentApproaches: /* @__PURE__ */ new Set()
  };
  cases.forEach((case_) => {
    if (case_.speechSample && case_.speechSample.observations) {
      insights.commonObservations.add(case_.speechSample.observations);
    }
    if (case_.languageSample && case_.languageSample.observations) {
      insights.commonObservations.add(case_.languageSample.observations);
    }
    if (case_.recommendations) {
      if (Array.isArray(case_.recommendations)) {
        case_.recommendations.forEach((rec) => insights.commonRecommendations.add(rec));
      } else if (typeof case_.recommendations === "string") {
        insights.commonRecommendations.add(case_.recommendations);
      }
    }
    if (case_.treatmentApproach) {
      insights.commonTreatmentApproaches.add(case_.treatmentApproach);
    }
  });
  return {
    commonObservations: Array.from(insights.commonObservations),
    commonRecommendations: Array.from(insights.commonRecommendations),
    commonTreatmentApproaches: Array.from(insights.commonTreatmentApproaches)
  };
}
function extractCommonPatterns(cases) {
  const patterns = /* @__PURE__ */ new Map();
  cases.forEach((case_) => {
    if (case_.speechSound) {
      if (case_.clusterReduction) {
        patterns.set("Cluster reduction", (patterns.get("Cluster reduction") || 0) + 1);
      }
      if (case_.finalConsonantDeletion) {
        patterns.set("Final consonant deletion", (patterns.get("Final consonant deletion") || 0) + 1);
      }
    }
  });
  const threshold = cases.length * 0.3;
  return Array.from(patterns.entries()).filter(([_, count]) => count >= threshold).map(([pattern, count]) => `${pattern} observed in ${Math.round(count / cases.length * 100)}% of similar cases`);
}
function analyzeScores(data, sampleEvaluations) {
  if (!data.tl_standard_score) return null;
  const currentScore = parseInt(data.tl_standard_score);
  const similarScores = sampleEvaluations.filter((sample) => sample.tl_standard_score).map((sample) => parseInt(sample.tl_standard_score)).filter((score) => !isNaN(score));
  if (similarScores.length === 0) return null;
  const avgScore = similarScores.reduce((a, b) => a + b, 0) / similarScores.length;
  let analysis = `Current total language score (${currentScore}) `;
  if (currentScore > avgScore + 10) {
    analysis += `is notably higher than the average score (${Math.round(avgScore)}) observed in similar cases.`;
  } else if (currentScore < avgScore - 10) {
    analysis += `is lower than the average score (${Math.round(avgScore)}) observed in similar cases.`;
  } else {
    analysis += `is consistent with the average score (${Math.round(avgScore)}) observed in similar cases.`;
  }
  return analysis;
}
function enhanceBackgroundInfo(data, similarCases) {
  if (!data.backgroundInfo) return null;
  const enhancedInfo = { ...data.backgroundInfo };
  const relevantCases = similarCases.filter((c) => c.backgroundInfo);
  if (relevantCases.length > 0) {
    const commonDevelopmentalPatterns = /* @__PURE__ */ new Set();
    const commonMedicalFactors = /* @__PURE__ */ new Set();
    relevantCases.forEach((case_) => {
      if (case_.backgroundInfo.developmentalHistory) {
        commonDevelopmentalPatterns.add(case_.backgroundInfo.developmentalHistory);
      }
      if (case_.backgroundInfo.medicalHistory) {
        commonMedicalFactors.add(case_.backgroundInfo.medicalHistory);
      }
    });
    enhancedInfo.commonDevelopmentalPatterns = Array.from(commonDevelopmentalPatterns);
    enhancedInfo.commonMedicalFactors = Array.from(commonMedicalFactors);
  }
  return enhancedInfo;
}
function analyzeOralMechanism(data, similarCases) {
  if (!data.oralMechanism) return null;
  const analysis = { ...data.oralMechanism };
  const relevantCases = similarCases.filter((c) => c.oralMechanism);
  if (relevantCases.length > 0) {
    const commonStructuralFindings = /* @__PURE__ */ new Map();
    const commonFunctionalFindings = /* @__PURE__ */ new Map();
    relevantCases.forEach((case_) => {
      if (case_.oralMechanism.structure) {
        Object.entries(case_.oralMechanism.structure).forEach(([key, value]) => {
          commonStructuralFindings.set(key, (commonStructuralFindings.get(key) || 0) + 1);
        });
      }
      if (case_.oralMechanism.function) {
        Object.entries(case_.oralMechanism.function).forEach(([key, value]) => {
          commonFunctionalFindings.set(key, (commonFunctionalFindings.get(key) || 0) + 1);
        });
      }
    });
    analysis.commonStructuralFindings = Object.fromEntries(commonStructuralFindings);
    analysis.commonFunctionalFindings = Object.fromEntries(commonFunctionalFindings);
  }
  return analysis;
}
function analyzeSpeechSound(data, similarCases) {
  if (!data.speechSound) return null;
  const analysis = { ...data.speechSound };
  const relevantCases = similarCases.filter((c) => c.speechSound);
  if (relevantCases.length > 0) {
    const errorPatterns = /* @__PURE__ */ new Map();
    const intelligibilityRatings = /* @__PURE__ */ new Map();
    relevantCases.forEach((c) => {
      if (c.speechSound.articulation && c.speechSound.articulation.errorPatterns) {
        c.speechSound.articulation.errorPatterns.forEach((pattern) => {
          const key = `${pattern.sound}-${pattern.substitution || "omission"}`;
          errorPatterns.set(key, (errorPatterns.get(key) || 0) + 1);
        });
      }
      if (c.speechSound.intelligibility) {
        Object.entries(c.speechSound.intelligibility).forEach(([key, value]) => {
          if (value === true) {
            intelligibilityRatings.set(key, (intelligibilityRatings.get(key) || 0) + 1);
          }
        });
      }
    });
    analysis.commonErrorPatterns = Object.fromEntries(errorPatterns);
    analysis.commonIntelligibilityRatings = Object.fromEntries(intelligibilityRatings);
  }
  return analysis;
}
function analyzeSpeechSample(data, similarCases) {
  if (!data.speechSample) return null;
  const analysis = { ...data.speechSample };
  const relevantCases = similarCases.filter((c) => c.speechSample && c.speechSample.observations);
  if (relevantCases.length > 0) {
    analysis.commonObservations = relevantCases.map((c) => c.speechSample.observations);
    const patterns = /* @__PURE__ */ new Set();
    relevantCases.forEach((c) => {
      const text = c.speechSample.observations.toLowerCase();
      if (text.includes("substitution")) patterns.add("sound substitution");
      if (text.includes("omission")) patterns.add("sound omission");
      if (text.includes("distortion")) patterns.add("sound distortion");
      if (text.includes("cluster")) patterns.add("cluster reduction");
      if (text.includes("final consonant")) patterns.add("final consonant deletion");
    });
    analysis.commonPatterns = Array.from(patterns);
  }
  return analysis;
}
function analyzeLanguageSample(data, similarCases) {
  if (!data.languageSample) return null;
  const analysis = { ...data.languageSample };
  const relevantCases = similarCases.filter((c) => c.languageSample && c.languageSample.observations);
  if (relevantCases.length > 0) {
    analysis.commonObservations = relevantCases.map((c) => c.languageSample.observations);
    const features = /* @__PURE__ */ new Set();
    relevantCases.forEach((c) => {
      const text = c.languageSample.observations.toLowerCase();
      if (text.includes("sentence")) features.add("sentence structure");
      if (text.includes("vocabulary")) features.add("vocabulary usage");
      if (text.includes("grammar")) features.add("grammatical structures");
      if (text.includes("pragmatic")) features.add("pragmatic skills");
    });
    analysis.commonFeatures = Array.from(features);
  }
  return analysis;
}
function generatePrognosisWithEvidence(data, sampleEvaluations) {
  let prognosis = "";
  const positiveFactors = [];
  if (getAgeInMonths2(data.age) < 60) {
    positiveFactors.push("early identification and intervention");
  }
  if (data.homeProgram) {
    positiveFactors.push("family commitment to home practice program");
  }
  const similarCases = findSimilarCases(data, sampleEvaluations);
  if (similarCases.length > 0) {
    const successfulCases = similarCases.filter((c) => c.outcome === "successful" || c.outcome === "improved");
    if (successfulCases.length > 0) {
      const successRate = Math.round(successfulCases.length / similarCases.length * 100);
      if (successRate > 50) {
        prognosis += `Research and clinical evidence from similar cases suggests a ${successRate}% success rate with appropriate intervention. `;
      }
    }
  }
  if (positiveFactors.length > 0) {
    prognosis += "Positive prognostic factors include " + positiveFactors.join(" and ") + ". ";
  }
  return prognosis;
}
function analyzeArticulation(data, similarCases) {
  const analysis = {
    patterns: [],
    implications: [],
    recommendations: []
  };
  if (data.speechSound && data.speechSound.articulation && data.speechSound.articulation.errorPatterns) {
    const errorPatterns = Array.isArray(data.speechSound.articulation.errorPatterns) ? data.speechSound.articulation.errorPatterns : [];
    const processes = /* @__PURE__ */ new Set();
    errorPatterns.forEach((error) => {
      if (error.sound.includes("s") && error.positions.includes("initial")) {
        processes.add("Initial consonant deletion");
      }
      if (error.sound.includes("l") || error.sound.includes("r")) {
        processes.add("Liquid simplification");
      }
      if (error.positions.includes("final")) {
        processes.add("Final consonant deletion");
      }
      if (error.sound.includes("s") && error.substitution.includes("t")) {
        processes.add("Fronting");
      }
      if (error.sound.includes("k") && error.substitution.includes("t")) {
        processes.add("Fronting");
      }
      if (error.sound.includes("g") && error.substitution.includes("d")) {
        processes.add("Fronting");
      }
    });
    analysis.patterns = Array.from(processes);
  }
  return analysis;
}

// public/assets/js/add-articulation-info.js
async function initializeDatabase() {
  try {
    await dbManager.init();
    console.log("Database initialized successfully");
    return true;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    return false;
  }
}
var articulationEvaluationInfo = {
  id: "articulation_evaluation_info",
  type: "reference_data",
  dateCreated: /* @__PURE__ */ new Date(),
  firstName: "Reference",
  lastName: "Data",
  patientName: "Reference Data",
  content: {
    title: "Articulation Evaluation",
    description: "Comprehensive information about articulation evaluation process and components",
    sections: [
      {
        title: "Case History and Background Information",
        content: "The evaluation begins with gathering detailed information about the client's medical, developmental, and social history. This includes understanding any previous speech or hearing issues, developmental milestones, family history of speech-language disorders, and educational background. This context helps the SLP identify potential factors contributing to the speech difficulties."
      },
      {
        title: "Hearing Screening",
        content: "Since hearing is integral to speech development and production, a hearing screening is often conducted to rule out hearing loss as a contributing factor to articulation problems."
      },
      {
        title: "Oral Mechanism Examination",
        content: "The SLP examines the physical structures involved in speech production, such as the lips, tongue, teeth, palate, and jaw. This assessment checks for structural anomalies (e.g., cleft palate) or functional issues (e.g., muscle weakness) that might affect speech. Techniques like electropalatography may be utilized to monitor tongue-to-palate contact during speech, providing dynamic visual feedback on articulatory patterns."
      },
      {
        title: "Speech Sound Assessment",
        content: "This core component evaluates the individual's ability to produce speech sounds correctly. The SLP may employ standardized tests, such as the Goldman-Fristoe Test of Articulation\u20133 (GFTA-3), where the client names pictures to elicit specific sounds in various word positions. This helps in identifying misarticulations and patterns of errors. Another tool is the Diagnostic Evaluation of Articulation and Phonology (DEAP), which assesses both articulation and phonological processes. It includes a series of subtests to diagnose articulation disorders and phonological impairments, providing a comprehensive profile of the individual's speech sound abilities."
      },
      {
        title: "Speech Sampling and Analysis",
        content: "Beyond standardized tests, the SLP collects spontaneous speech samples during naturalistic interactions. This involves engaging the client in conversation or storytelling to observe speech in a functional context. The SLP analyzes these samples for error patterns, intelligibility, and the impact of speech sound errors on overall communication."
      },
      {
        title: "Stimulability Testing",
        content: "This assesses the client's ability to produce correct sounds with assistance. The SLP provides cues or models specific sounds to determine if the individual can imitate them accurately. Stimulability testing helps in predicting which sounds may improve with intervention and guides the prioritization of therapy goals."
      },
      {
        title: "Phonological Process Analysis",
        content: "For clients, especially children, who exhibit patterns of sound errors, the SLP analyzes these patterns to identify phonological processes. Understanding whether errors are due to typical developmental processes or indicative of a phonological disorder is crucial for effective treatment planning."
      },
      {
        title: "Documentation and Reporting",
        content: "After the assessment, the SLP compiles a comprehensive report detailing: Background Information (summarizing the case history and any relevant medical or developmental information), Assessment Procedures (outlining the tests and tools used during the evaluation), Findings (describing observed speech sound errors, patterns, and any related factors), Diagnosis (providing a professional judgment regarding the presence and type of speech sound disorder), and Recommendations (suggesting intervention strategies, goals, and any referrals to other professionals if necessary). This report serves as a foundational document for planning therapy and tracking progress over time."
      },
      {
        title: "Client and Family Consultation",
        content: "The SLP discusses the evaluation results with the client and their family, explaining the nature of the identified speech sound disorder in understandable terms. This collaborative discussion includes outlining the proposed intervention plan, setting realistic goals, and providing guidance on how the family can support the client's speech development at home."
      }
    ],
    standardizedTests: [
      {
        name: "Goldman-Fristoe Test of Articulation\u20133 (GFTA-3)",
        description: "A standardized test where the client names pictures to elicit specific sounds in various word positions, helping to identify misarticulations and patterns of errors.",
        citation: "citeturn0search6"
      },
      {
        name: "Diagnostic Evaluation of Articulation and Phonology (DEAP)",
        description: "Assesses both articulation and phonological processes through a series of subtests to diagnose articulation disorders and phonological impairments, providing a comprehensive profile of speech sound abilities.",
        citation: "citeturn0search1"
      }
    ],
    techniques: [
      {
        name: "Electropalatography",
        description: "A technique used to monitor tongue-to-palate contact during speech, providing dynamic visual feedback on articulatory patterns.",
        citation: "citeturn0search13"
      }
    ],
    phonologicalProcesses: [
      {
        name: "Cluster Reduction",
        description: 'Simplifying consonant clusters by omitting one or more consonants (e.g., "stop" \u2192 "top")',
        ageOfElimination: "4 years"
      },
      {
        name: "Final Consonant Deletion",
        description: 'Omitting the final consonant in words (e.g., "cat" \u2192 "ca")',
        ageOfElimination: "3 years"
      },
      {
        name: "Fronting",
        description: 'Substituting sounds made in the back of the mouth with sounds made in the front (e.g., "key" \u2192 "tea")',
        ageOfElimination: "3.5 years"
      },
      {
        name: "Stopping",
        description: 'Replacing fricatives or affricates with stop consonants (e.g., "see" \u2192 "tee")',
        ageOfElimination: "3-5 years"
      },
      {
        name: "Weak Syllable Deletion",
        description: 'Omitting unstressed syllables (e.g., "banana" \u2192 "nana")',
        ageOfElimination: "4 years"
      }
    ],
    clinicalImpressionEnhancements: [
      {
        pattern: "articulation disorder",
        enhancement: "The articulation disorder is characterized by consistent errors in the production of specific speech sounds, affecting the physical production of sounds rather than the linguistic organization of the sound system. This is evidenced by the pattern of substitutions, omissions, and distortions observed during both structured assessment and spontaneous speech samples."
      },
      {
        pattern: "phonological disorder",
        enhancement: "The phonological disorder is characterized by systematic patterns of sound errors that reflect difficulties with the linguistic organization of speech sounds rather than physical production abilities. This is evidenced by the presence of multiple phonological processes such as cluster reduction, final consonant deletion, and fronting that affect entire classes of sounds rather than individual phonemes."
      },
      {
        pattern: "oral mechanism",
        enhancement: "The oral mechanism examination revealed structural and functional characteristics that may contribute to the observed speech production difficulties. The assessment of lips, tongue, teeth, palate, and jaw provides important context for understanding the physical basis of articulation errors and informs the development of appropriate intervention strategies."
      },
      {
        pattern: "stimulability",
        enhancement: "Stimulability testing indicates which misarticulated sounds the client can produce correctly with cueing or modeling, providing valuable prognostic information. Sounds that are stimulable typically respond more quickly to intervention than those that are not stimulable, which helps prioritize treatment targets and predict the course of therapy."
      }
    ]
  }
};
async function addArticulationInfo() {
  try {
    if (await initializeDatabase()) {
      try {
        await dbManager.getEvaluation("articulation_evaluation_info");
        console.log("Articulation evaluation information already exists in the database");
        await dbManager.updateEvaluation("articulation_evaluation_info", articulationEvaluationInfo);
        console.log("Articulation evaluation information updated successfully");
      } catch (error) {
        if (error.name === "ValidationError" && error.message.includes("not found")) {
          const id = await dbManager.storeEvaluation(articulationEvaluationInfo);
          console.log("Articulation evaluation information added successfully with ID:", id);
        } else {
          throw error;
        }
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("Failed to add articulation evaluation information:", error);
    return false;
  }
}
async function enhanceTemplateEngine() {
  try {
    const { templateEngine: templateEngine2 } = await Promise.resolve().then(() => (init_template_engine(), template_engine_exports));
    templateEngine2.registerTemplate("articulationEvaluationInfo", (data) => {
      return `
                <div class="articulation-evaluation-info">
                    <h3>Articulation Evaluation Process</h3>
                    <p>An articulation evaluation is a comprehensive assessment designed to identify and analyze speech sound disorders, aiming to understand the nature of speech difficulties and develop an effective intervention plan.</p>
                    
                    <h4>Key Components:</h4>
                    <ul>
                        ${articulationEvaluationInfo.content.sections.map(
        (section) => `<li><strong>${section.title}:</strong> ${section.content}</li>`
      ).join("")}
                    </ul>
                    
                    <h4>Common Standardized Tests:</h4>
                    <ul>
                        ${articulationEvaluationInfo.content.standardizedTests.map(
        (test) => `<li><strong>${test.name}:</strong> ${test.description}</li>`
      ).join("")}
                    </ul>
                    
                    <h4>Common Phonological Processes:</h4>
                    <ul>
                        ${articulationEvaluationInfo.content.phonologicalProcesses.map(
        (process) => `<li><strong>${process.name}:</strong> ${process.description} (typically eliminated by ${process.ageOfElimination})</li>`
      ).join("")}
                    </ul>
                </div>
            `;
    });
    const originalClinicalImpressionsTemplate = templateEngine2.templates.get("clinicalImpressions");
    templateEngine2.registerTemplate("clinicalImpressions", (data) => {
      let impression = originalClinicalImpressionsTemplate(data);
      if (data.speechSound || data.oralMechanism) {
        articulationEvaluationInfo.content.clinicalImpressionEnhancements.forEach((enhancement) => {
          if (impression.toLowerCase().includes(enhancement.pattern)) {
            impression += `

<div class="enhanced-impression">${enhancement.enhancement}</div>`;
          }
        });
      }
      return impression;
    });
    console.log("Template engine enhanced with articulation evaluation information");
    return true;
  } catch (error) {
    console.error("Failed to enhance template engine:", error);
    return false;
  }
}
document.addEventListener("DOMContentLoaded", async () => {
  console.log("Adding articulation evaluation information to the database...");
  const dbSuccess = await addArticulationInfo();
  if (dbSuccess) {
    console.log("Enhancing template engine with articulation information...");
    await enhanceTemplateEngine();
  }
});

// public/assets/js/main.js
var ApplicationManager = class {
  constructor() {
    this.initialized = false;
    this.formHandler = null;
    this.pdfGenerator = null;
    this.debug = false;
    this.templateEngine = templateEngine;
    this.handleError = this.handleError.bind(this);
    this.handleStateChange = this.handleStateChange.bind(this);
    this.handleTemplateEdit = this.handleTemplateEdit.bind(this);
  }
  // Initialize the application
  async initialize() {
    try {
      this.initializeErrorHandling();
      console.log("Initializing application...");
      window.addEventListener("error", this.handleError);
      window.addEventListener("unhandledrejection", this.handleError);
      await dbManager.init();
      console.log("Database initialized");
      console.log("Adding articulation evaluation information...");
      await addArticulationInfo();
      await enhanceTemplateEngine();
      console.log("Articulation evaluation information added");
      this.formHandler = new form_handler_default();
      this.pdfGenerator = createPDFGenerator();
      console.log("PDF Generator initialized");
      if (!window.app) {
        window.app = this;
        window.app.templateEngine = this.templateEngine;
        window.app.formHandler = this.formHandler;
        window.app.pdfGenerator = this.pdfGenerator;
        console.log("Application components exposed globally");
      }
      this.setupStateListeners();
      this.setupKeyboardShortcuts();
      this.setupGenerateReport();
      this.setupPDFGeneration();
      this.initialized = true;
      console.log("Application initialization complete");
      window.dispatchEvent(new CustomEvent("app-initialized"));
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }
  // Set up state change listeners
  setupStateListeners() {
    document.getElementById("evaluationForm")?.addEventListener("change", this.handleStateChange);
    window.addEventListener("storage", (event) => {
      if (event.key === "evaluationFormData") {
        this.handleStorageChange(event);
      }
    });
    document.getElementById("clinicalImpressions")?.addEventListener("input", this.handleTemplateEdit);
  }
  // Set up Generate Report button
  setupGenerateReport() {
    const generateButton = document.getElementById("generateReport");
    if (generateButton) {
      generateButton.addEventListener("click", async () => {
        const originalText = generateButton.textContent;
        generateButton.disabled = true;
        generateButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating...';
        try {
          const formData = this.formHandler.collectFormData();
          if (!formData.firstName || !formData.lastName) {
            throw new Error("Patient name is required to generate summary");
          }
          const impressionsField = document.getElementById("clinicalImpressionsSummary");
          if (!impressionsField) {
            throw new Error("Clinical impressions summary field not found");
          }
          const summary = await generateSummary(formData);
          if (!summary) {
            throw new Error("Failed to generate clinical impressions summary");
          }
          impressionsField.innerHTML = summary.replace(/\n/g, "<br>");
          impressionsField.style.whiteSpace = "pre-line";
          try {
            await dbManager.storeEvaluation({
              ...formData,
              impression: summary,
              dateCreated: /* @__PURE__ */ new Date()
            });
            this.showSuccessMessage("Summary generated and integrated successfully");
          } catch (dbError) {
            console.warn("Failed to store in database, but report was generated:", dbError);
            this.showSuccessMessage("Summary generated successfully (storage failed)");
          }
        } catch (error) {
          console.error("Error generating report:", error);
          this.handleError(error);
        } finally {
          generateButton.disabled = false;
          generateButton.textContent = originalText;
        }
      });
    }
  }
  // Show success message
  showSuccessMessage(message) {
    const successAlert = document.createElement("div");
    successAlert.className = "alert alert-success alert-dismissible fade show position-fixed top-0 end-0 m-3";
    successAlert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
    document.body.appendChild(successAlert);
    setTimeout(() => {
      successAlert.remove();
    }, 3e3);
  }
  // Set up PDF generation button
  setupPDFGeneration() {
    const pdfButton = document.getElementById("generatePDF");
    if (pdfButton) {
      pdfButton.addEventListener("click", async () => {
        try {
          pdfButton.disabled = true;
          pdfButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generating PDF...';
          const formData = this.formHandler.collectFormData();
          if (!formData.firstName || !formData.lastName) {
            throw new Error("First name and last name are required");
          }
          const success = await this.pdfGenerator.generatePDF(formData);
          if (success) {
            await dbManager.storeEvaluation({
              ...formData,
              hasPDF: true,
              dateCreated: /* @__PURE__ */ new Date()
            });
            this.showSuccessMessage("PDF generated successfully");
          }
        } catch (error) {
          console.error("Error generating PDF:", error);
          this.handleError(error);
        } finally {
          pdfButton.disabled = false;
          pdfButton.textContent = "Generate PDF";
        }
      });
    }
  }
  // Handle state changes
  handleStateChange(event) {
    if (!this.initialized) return;
    try {
      const element = event.target;
      const sectionId = this.getSectionId(element);
      if (sectionId) {
        this.log(`State change in section: ${sectionId}`);
        this.updateRelatedFields(element);
      }
    } catch (error) {
      this.handleError(error);
    }
  }
  // Update fields related to a change
  updateRelatedFields(changedElement) {
    const relatedFields = this.getRelatedFields(changedElement);
    relatedFields.forEach((field) => {
      try {
        this.formHandler.handleFieldChange(field);
      } catch (error) {
        this.handleError(error);
      }
    });
  }
  // Get fields related to a changed element
  getRelatedFields(element) {
    const related = /* @__PURE__ */ new Set();
    const id = element.id;
    if (id.includes("standard_score")) {
      const base = id.split("_")[0];
      related.add(document.getElementById(`${base}_severity`));
      related.add(document.getElementById(`${base}_percentile`));
    }
    return Array.from(related).filter(Boolean);
  }
  // Handle template edits for pattern learning
  async handleTemplateEdit(event) {
    try {
      const element = event.target;
      const newContent = element.value;
      const formData = this.formHandler.collectFormData();
      await dbManager.storeEvaluation({
        ...formData,
        impression: newContent,
        isUserEdit: true,
        dateCreated: /* @__PURE__ */ new Date()
      });
      this.log("Template edit stored for pattern learning");
    } catch (error) {
      console.error("Error storing template edit:", error);
      this.handleError(error);
    }
  }
  // Handle storage changes
  handleStorageChange(event) {
    try {
      const newData = JSON.parse(event.newValue);
      if (newData && this.formHandler) {
        this.formHandler.populateForm(newData);
      }
    } catch (error) {
      this.handleError(error);
    }
  }
  // Set up keyboard shortcuts
  setupKeyboardShortcuts() {
    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "s") {
        event.preventDefault();
        this.formHandler.handleFormSubmission();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "p") {
        event.preventDefault();
        const pdfButton = document.getElementById("generatePDF");
        if (pdfButton) {
          pdfButton.click();
        }
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "d") {
        event.preventDefault();
        this.toggleDebug();
      }
    });
  }
  // Toggle debug mode
  toggleDebug() {
    this.debug = !this.debug;
    console.log(`Debug mode: ${this.debug ? "enabled" : "disabled"}`);
  }
  // Get section ID for an element
  getSectionId(element) {
    return element.closest("section")?.id;
  }
  // Error handling
  handleError(error) {
    const errorBoundary = document.getElementById("errorBoundary");
    const errorMessage = document.getElementById("errorMessage");
    let message;
    if (error instanceof Error) {
      message = this.debug ? `Error: ${error.message}

Stack: ${error.stack}` : "An error occurred. Please try again or contact support if the problem persists.";
    } else if (error instanceof Event && error.reason) {
      message = this.debug ? `Error: ${error.reason.message}

Stack: ${error.reason.stack}` : "An error occurred. Please try again or contact support if the problem persists.";
    } else {
      message = "An unknown error occurred. Please try again.";
    }
    if (errorBoundary && errorMessage) {
      console.error("Application error:", error);
      errorMessage.textContent = message;
      errorBoundary.classList.add("show");
    } else {
      alert(message);
    }
    if (error instanceof Event) {
      error.preventDefault();
    }
  }
  // Initialize error handling
  initializeErrorHandling() {
    const errorBoundary = document.getElementById("errorBoundary");
    if (errorBoundary) {
      errorBoundary.classList.remove("show");
      const reloadButton = errorBoundary.querySelector("button");
      if (reloadButton) {
        reloadButton.addEventListener("click", () => {
          errorBoundary.classList.remove("show");
          location.reload();
        });
      }
    }
  }
  // Logging utility
  log(message) {
    if (this.debug) {
      console.log(`[${(/* @__PURE__ */ new Date()).toISOString()}] ${message}`);
    }
  }
};
var app;
function initApp() {
  if (!app) {
    app = new ApplicationManager();
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => app.initialize());
    } else {
      app.initialize();
    }
  }
}
initApp();
var main_default = app;
export {
  main_default as default
};
