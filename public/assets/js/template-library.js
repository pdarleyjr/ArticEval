// IPLC ArticEval Template Library
// Professional form templates for SurveyJS integration

const templateLibrary = {
    healthcare: [
        {
            id: 'patient-intake',
            name: 'Patient Intake Form',
            description: 'Comprehensive patient intake form for healthcare facilities',
            features: ['Patient demographics', 'Medical history', 'Insurance information', 'Emergency contacts'],
            surveyJson: {
                title: "Patient Intake Form",
                pages: [{
                    name: "demographics",
                    title: "Patient Demographics",
                    elements: [
                        { type: "text", name: "firstName", title: "First Name", isRequired: true },
                        { type: "text", name: "lastName", title: "Last Name", isRequired: true },
                        { type: "text", name: "dateOfBirth", title: "Date of Birth", inputType: "date", isRequired: true },
                        { type: "dropdown", name: "gender", title: "Gender", choices: ["Male", "Female", "Other", "Prefer not to say"], isRequired: true },
                        { type: "text", name: "address", title: "Address", isRequired: true },
                        { type: "text", name: "phone", title: "Phone Number", isRequired: true },
                        { type: "text", name: "email", title: "Email Address", inputType: "email", isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'clinical-assessment',
            name: 'Clinical Assessment',
            description: 'Standardized clinical assessment form for healthcare providers',
            features: ['Symptoms evaluation', 'Physical examination', 'Treatment planning', 'Progress tracking'],
            surveyJson: {
                title: "Clinical Assessment",
                pages: [{
                    name: "assessment",
                    title: "Clinical Assessment",
                    elements: [
                        { type: "text", name: "patientId", title: "Patient ID", isRequired: true },
                        { type: "text", name: "assessmentDate", title: "Assessment Date", inputType: "date", isRequired: true },
                        { type: "comment", name: "chiefComplaint", title: "Chief Complaint", isRequired: true },
                        { type: "rating", name: "painLevel", title: "Pain Level (0-10)", rateMin: 0, rateMax: 10 }
                    ]
                }]
            }
        },
        {
            id: 'medication-history',
            name: 'Medication History',
            description: 'Comprehensive medication history and reconciliation form',
            features: ['Current medications', 'Dosage tracking', 'Allergy management', 'Prescription history'],
            surveyJson: {
                title: "Medication History",
                pages: [{
                    name: "medications",
                    title: "Medication Information",
                    elements: [
                        { type: "text", name: "patientName", title: "Patient Name", isRequired: true },
                        { type: "text", name: "dateCompleted", title: "Date Completed", inputType: "date", isRequired: true },
                        { type: "comment", name: "allergies", title: "Drug Allergies and Reactions" }
                    ]
                }]
            }
        },
        {
            id: 'discharge-summary',
            name: 'Discharge Summary',
            description: 'Patient discharge summary and follow-up instructions',
            features: ['Diagnosis summary', 'Treatment provided', 'Follow-up care', 'Medication instructions'],
            surveyJson: {
                title: "Discharge Summary",
                pages: [{
                    name: "discharge",
                    title: "Discharge Information",
                    elements: [
                        { type: "text", name: "patientName", title: "Patient Name", isRequired: true },
                        { type: "text", name: "dischargeDate", title: "Discharge Date", inputType: "date", isRequired: true },
                        { type: "comment", name: "dischargeInstructions", title: "Discharge Instructions", isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'consent-form',
            name: 'Medical Consent Form',
            description: 'Patient consent form for medical procedures and treatments',
            features: ['Procedure consent', 'Risk acknowledgment', 'Patient rights', 'Legal compliance'],
            surveyJson: {
                title: "Medical Consent Form",
                pages: [{
                    name: "consent",
                    title: "Medical Consent",
                    elements: [
                        { type: "text", name: "patientName", title: "Patient Name", isRequired: true },
                        { type: "comment", name: "procedureDescription", title: "Procedure/Treatment Description", isRequired: true },
                        { type: "boolean", name: "consentGiven", title: "I give my consent for this procedure/treatment", isRequired: true }
                    ]
                }]
            }
        }
    ],
    hr: [
        {
            id: 'employee-onboarding',
            name: 'Employee Onboarding',
            description: 'Comprehensive new employee onboarding checklist and information form',
            features: ['Personal information', 'Emergency contacts', 'Tax information', 'Company policies'],
            surveyJson: {
                title: "Employee Onboarding Form",
                pages: [{
                    name: "personal",
                    title: "Personal Information",
                    elements: [
                        { type: "text", name: "firstName", title: "First Name", isRequired: true },
                        { type: "text", name: "lastName", title: "Last Name", isRequired: true },
                        { type: "text", name: "email", title: "Personal Email", inputType: "email", isRequired: true },
                        { type: "text", name: "startDate", title: "Start Date", inputType: "date", isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'performance-review',
            name: 'Performance Review',
            description: 'Annual employee performance evaluation form',
            features: ['Goal assessment', 'Skill evaluation', '360-degree feedback', 'Development planning'],
            surveyJson: {
                title: "Performance Review",
                pages: [{
                    name: "performance",
                    title: "Performance Evaluation",
                    elements: [
                        { type: "text", name: "employeeName", title: "Employee Name", isRequired: true },
                        { type: "text", name: "reviewPeriod", title: "Review Period", isRequired: true },
                        { type: "rating", name: "jobKnowledge", title: "Job Knowledge", rateMin: 1, rateMax: 5, isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'time-off-request',
            name: 'Time Off Request',
            description: 'Employee time off and vacation request form',
            features: ['Date selection', 'Request type', 'Approval workflow', 'Coverage planning'],
            surveyJson: {
                title: "Time Off Request",
                pages: [{
                    name: "request",
                    title: "Time Off Request",
                    elements: [
                        { type: "text", name: "employeeName", title: "Employee Name", isRequired: true },
                        { type: "dropdown", name: "requestType", title: "Type of Leave", choices: ["Vacation", "Sick Leave", "Personal Day"], isRequired: true },
                        { type: "text", name: "startDate", title: "Start Date", inputType: "date", isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'expense-report',
            name: 'Expense Report',
            description: 'Employee expense reimbursement form',
            features: ['Expense tracking', 'Receipt management', 'Category classification', 'Approval workflow'],
            surveyJson: {
                title: "Expense Report",
                pages: [{
                    name: "details",
                    title: "Expense Details",
                    elements: [
                        { type: "text", name: "employeeName", title: "Employee Name", isRequired: true },
                        { type: "text", name: "reportDate", title: "Report Date", inputType: "date", isRequired: true },
                        { type: "text", name: "totalAmount", title: "Total Amount", inputType: "number", isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'exit-interview',
            name: 'Exit Interview',
            description: 'Employee exit interview feedback form',
            features: ['Departure feedback', 'Company evaluation', 'Improvement suggestions', 'Confidential responses'],
            surveyJson: {
                title: "Exit Interview",
                pages: [{
                    name: "feedback",
                    title: "Feedback",
                    elements: [
                        { type: "text", name: "employeeName", title: "Employee Name", isRequired: true },
                        { type: "dropdown", name: "reasonForLeaving", title: "Primary Reason for Leaving", choices: ["New Job Opportunity", "Career Advancement", "Salary/Benefits"], isRequired: true },
                        { type: "rating", name: "jobSatisfaction", title: "Overall Job Satisfaction", rateMin: 1, rateMax: 5 }
                    ]
                }]
            }
        }
    ],
    education: [
        {
            id: 'student-enrollment',
            name: 'Student Enrollment',
            description: 'New student enrollment and registration form',
            features: ['Student information', 'Academic history', 'Course selection', 'Emergency contacts'],
            surveyJson: {
                title: "Student Enrollment Form",
                pages: [{
                    name: "student",
                    title: "Student Information",
                    elements: [
                        { type: "text", name: "firstName", title: "First Name", isRequired: true },
                        { type: "text", name: "lastName", title: "Last Name", isRequired: true },
                        { type: "text", name: "studentId", title: "Student ID", isRequired: true },
                        { type: "dropdown", name: "program", title: "Academic Program", choices: ["Undergraduate", "Graduate", "Doctoral"], isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'course-evaluation',
            name: 'Course Evaluation',
            description: 'Student course and instructor evaluation form',
            features: ['Course rating', 'Instructor feedback', 'Learning outcomes', 'Improvement suggestions'],
            surveyJson: {
                title: "Course Evaluation",
                pages: [{
                    name: "evaluation",
                    title: "Course Evaluation",
                    elements: [
                        { type: "text", name: "courseName", title: "Course Name", isRequired: true },
                        { type: "text", name: "instructor", title: "Instructor Name", isRequired: true },
                        { type: "rating", name: "overallRating", title: "Overall Course Rating", rateMin: 1, rateMax: 5, isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'scholarship-application',
            name: 'Scholarship Application',
            description: 'Student scholarship application and financial aid form',
            features: ['Academic records', 'Financial information', 'Essays', 'References'],
            surveyJson: {
                title: "Scholarship Application",
                pages: [{
                    name: "applicant",
                    title: "Applicant Information",
                    elements: [
                        { type: "text", name: "firstName", title: "First Name", isRequired: true },
                        { type: "text", name: "studentId", title: "Student ID", isRequired: true },
                        { type: "text", name: "currentGPA", title: "Current GPA", inputType: "number", isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'faculty-evaluation',
            name: 'Faculty Evaluation',
            description: 'Annual faculty performance evaluation form',
            features: ['Teaching effectiveness', 'Research activities', 'Service contributions', 'Professional development'],
            surveyJson: {
                title: "Faculty Evaluation",
                pages: [{
                    name: "performance",
                    title: "Performance Evaluation",
                    elements: [
                        { type: "text", name: "facultyName", title: "Faculty Name", isRequired: true },
                        { type: "text", name: "department", title: "Department", isRequired: true },
                        { type: "rating", name: "teaching", title: "Teaching Effectiveness", rateMin: 1, rateMax: 5, isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'parent-conference',
            name: 'Parent-Teacher Conference',
            description: 'Parent-teacher conference scheduling and feedback form',
            features: ['Meeting scheduling', 'Student progress', 'Behavior assessment', 'Action plans'],
            surveyJson: {
                title: "Parent-Teacher Conference",
                pages: [{
                    name: "conference",
                    title: "Conference Information",
                    elements: [
                        { type: "text", name: "studentName", title: "Student Name", isRequired: true },
                        { type: "text", name: "grade", title: "Grade Level", isRequired: true },
                        { type: "text", name: "teacher", title: "Teacher Name", isRequired: true }
                    ]
                }]
            }
        }
    ],
    business: [
        {
            id: 'customer-survey',
            name: 'Customer Satisfaction Survey',
            description: 'Comprehensive customer satisfaction and feedback survey',
            features: ['Service rating', 'Product feedback', 'NPS scoring', 'Improvement suggestions'],
            surveyJson: {
                title: "Customer Satisfaction Survey",
                pages: [{
                    name: "satisfaction",
                    title: "Your Experience",
                    elements: [
                        { type: "rating", name: "overallSatisfaction", title: "Overall Satisfaction", rateMin: 1, rateMax: 5, isRequired: true },
                        { type: "rating", name: "likelihood", title: "Likelihood to Recommend (0-10)", rateMin: 0, rateMax: 10, isRequired: true },
                        { type: "comment", name: "improvements", title: "How can we improve?" }
                    ]
                }]
            }
        },
        {
            id: 'vendor-assessment',
            name: 'Vendor Assessment',
            description: 'Supplier and vendor performance evaluation form',
            features: ['Performance metrics', 'Quality assessment', 'Delivery tracking', 'Cost analysis'],
            surveyJson: {
                title: "Vendor Assessment",
                pages: [{
                    name: "assessment",
                    title: "Vendor Performance",
                    elements: [
                        { type: "text", name: "vendorName", title: "Vendor Name", isRequired: true },
                        { type: "rating", name: "qualityRating", title: "Quality of Products/Services", rateMin: 1, rateMax: 5, isRequired: true },
                        { type: "rating", name: "deliveryRating", title: "On-Time Delivery", rateMin: 1, rateMax: 5, isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'project-proposal',
            name: 'Project Proposal',
            description: 'Business project proposal and approval form',
            features: ['Project scope', 'Budget planning', 'Timeline', 'Resource allocation'],
            surveyJson: {
                title: "Project Proposal",
                pages: [{
                    name: "proposal",
                    title: "Project Details",
                    elements: [
                        { type: "text", name: "projectTitle", title: "Project Title", isRequired: true },
                        { type: "text", name: "projectManager", title: "Project Manager", isRequired: true },
                        { type: "text", name: "budget", title: "Estimated Budget", inputType: "number", isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'meeting-feedback',
            name: 'Meeting Feedback',
            description: 'Post-meeting evaluation and feedback form',
            features: ['Meeting effectiveness', 'Participant feedback', 'Action items', 'Follow-up planning'],
            surveyJson: {
                title: "Meeting Feedback",
                pages: [{
                    name: "feedback",
                    title: "Meeting Evaluation",
                    elements: [
                        { type: "text", name: "meetingTitle", title: "Meeting Title", isRequired: true },
                        { type: "rating", name: "effectiveness", title: "Meeting Effectiveness", rateMin: 1, rateMax: 5, isRequired: true },
                        { type: "boolean", name: "objectivesMet", title: "Meeting objectives were achieved" }
                    ]
                }]
            }
        },
        {
            id: 'risk-assessment',
            name: 'Risk Assessment',
            description: 'Business risk identification and mitigation planning form',
            features: ['Risk identification', 'Impact analysis', 'Probability assessment', 'Mitigation strategies'],
            surveyJson: {
                title: "Risk Assessment",
                pages: [{
                    name: "risk",
                    title: "Risk Analysis",
                    elements: [
                        { type: "text", name: "riskTitle", title: "Risk Title", isRequired: true },
                        { type: "dropdown", name: "riskCategory", title: "Risk Category", choices: ["Financial", "Operational", "Strategic"], isRequired: true },
                        { type: "rating", name: "probability", title: "Probability (1-5)", rateMin: 1, rateMax: 5, isRequired: true }
                    ]
                }]
            }
        }
    ],
    research: [
        {
            id: 'research-survey',
            name: 'Research Survey',
            description: 'Academic research participant survey form',
            features: ['Participant consent', 'Demographics', 'Research questions', 'Data collection'],
            surveyJson: {
                title: "Research Survey",
                pages: [{
                    name: "consent",
                    title: "Informed Consent",
                    elements: [
                        { type: "boolean", name: "consentGiven", title: "I consent to participate in this research study", isRequired: true },
                        { type: "text", name: "participantId", title: "Participant ID", isRequired: true },
                        { type: "text", name: "age", title: "Age", inputType: "number", isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'data-collection',
            name: 'Data Collection Form',
            description: 'Structured data collection form for research studies',
            features: ['Data points', 'Measurements', 'Observations', 'Quality control'],
            surveyJson: {
                title: "Data Collection Form",
                pages: [{
                    name: "data",
                    title: "Data Collection",
                    elements: [
                        { type: "text", name: "studyId", title: "Study ID", isRequired: true },
                        { type: "text", name: "subjectId", title: "Subject ID", isRequired: true },
                        { type: "comment", name: "observations", title: "Observations" }
                    ]
                }]
            }
        },
        {
            id: 'participant-screening',
            name: 'Participant Screening',
            description: 'Research participant eligibility screening form',
            features: ['Eligibility criteria', 'Exclusion factors', 'Medical history', 'Availability'],
            surveyJson: {
                title: "Participant Screening",
                pages: [{
                    name: "screening",
                    title: "Eligibility Screening",
                    elements: [
                        { type: "text", name: "name", title: "Full Name", isRequired: true },
                        { type: "text", name: "email", title: "Email Address", inputType: "email", isRequired: true },
                        { type: "text", name: "age", title: "Age", inputType: "number", isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'experiment-log',
            name: 'Experiment Log',
            description: 'Laboratory experiment documentation and results log',
            features: ['Procedure tracking', 'Results recording', 'Variable control', 'Quality assurance'],
            surveyJson: {
                title: "Experiment Log",
                pages: [{
                    name: "experiment",
                    title: "Experiment Details",
                    elements: [
                        { type: "text", name: "experimentId", title: "Experiment ID", isRequired: true },
                        { type: "text", name: "date", title: "Date", inputType: "date", isRequired: true },
                        { type: "comment", name: "hypothesis", title: "Hypothesis", isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'ethics-review',
            name: 'Ethics Review Application',
            description: 'Research ethics committee review application form',
            features: ['Research proposal', 'Ethics considerations', 'Risk assessment', 'Participant protection'],
            surveyJson: {
                title: "Ethics Review Application",
                pages: [{
                    name: "application",
                    title: "Ethics Review",
                    elements: [
                        { type: "text", name: "projectTitle", title: "Project Title", isRequired: true },
                        { type: "text", name: "principalInvestigator", title: "Principal Investigator", isRequired: true },
                        { type: "comment", name: "abstract", title: "Research Abstract", isRequired: true }
                    ]
                }]
            }
        }
    ],
    customer: [
        {
            id: 'support-ticket',
            name: 'Support Ticket',
            description: 'Customer support request and issue tracking form',
            features: ['Issue classification', 'Priority setting', 'Contact information', 'Resolution tracking'],
            surveyJson: {
                title: "Support Ticket",
                pages: [{
                    name: "ticket",
                    title: "Support Request",
                    elements: [
                        { type: "text", name: "customerName", title: "Customer Name", isRequired: true },
                        { type: "text", name: "email", title: "Email Address", inputType: "email", isRequired: true },
                        { type: "dropdown", name: "issueType", title: "Issue Type", choices: ["Technical Problem", "Billing Question", "Feature Request"], isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'product-feedback',
            name: 'Product Feedback',
            description: 'Customer product feedback and improvement suggestions',
            features: ['Feature rating', 'Usage patterns', 'Improvement ideas', 'User experience'],
            surveyJson: {
                title: "Product Feedback",
                pages: [{
                    name: "feedback",
                    title: "Your Feedback",
                    elements: [
                        { type: "text", name: "productName", title: "Product Name", isRequired: true },
                        { type: "rating", name: "overallSatisfaction", title: "Overall Satisfaction", rateMin: 1, rateMax: 5, isRequired: true },
                        { type: "comment", name: "improvements", title: "What improvements would you suggest?" }
                    ]
                }]
            }
        },
        {
            id: 'service-request',
            name: 'Service Request',
            description: 'Customer service request and appointment scheduling form',
            features: ['Service selection', 'Scheduling', 'Requirements', 'Contact preferences'],
            surveyJson: {
                title: "Service Request",
                pages: [{
                    name: "request",
                    title: "Service Request",
                    elements: [
                        { type: "text", name: "customerName", title: "Customer Name", isRequired: true },
                        { type: "text", name: "email", title: "Email Address", inputType: "email", isRequired: true },
                        { type: "dropdown", name: "serviceType", title: "Service Type", choices: ["Installation", "Maintenance", "Repair"], isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'complaint-form',
            name: 'Customer Complaint',
            description: 'Formal customer complaint and resolution tracking form',
            features: ['Complaint details', 'Impact assessment', 'Resolution request', 'Follow-up tracking'],
            surveyJson: {
                title: "Customer Complaint Form",
                pages: [{
                    name: "complaint",
                    title: "Complaint Details",
                    elements: [
                        { type: "text", name: "customerName", title: "Customer Name", isRequired: true },
                        { type: "text", name: "incidentDate", title: "Date of Incident", inputType: "date", isRequired: true },
                        { type: "comment", name: "description", title: "Detailed Description of Complaint", isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'testimonial',
            name: 'Customer Testimonial',
            description: 'Customer testimonial and success story collection form',
            features: ['Experience sharing', 'Success metrics', 'Quote collection', 'Permission management'],
            surveyJson: {
                title: "Customer Testimonial",
                pages: [{
                    name: "testimonial",
                    title: "Share Your Experience",
                    elements: [
                        { type: "text", name: "customerName", title: "Your Name", isRequired: true },
                        { type: "comment", name: "experience", title: "Tell us about your experience with our product/service", isRequired: true },
                        { type: "rating", name: "recommendation", title: "How likely are you to recommend us? (0-10)", rateMin: 0, rateMax: 10, isRequired: true }
                    ]
                }]
            }
        }
    ],
    events: [
        {
            id: 'event-registration',
            name: 'Event Registration',
            description: 'Event registration and attendee information form',
            features: ['Attendee details', 'Session selection', 'Dietary requirements', 'Payment processing'],
            surveyJson: {
                title: "Event Registration",
                pages: [{
                    name: "registration",
                    title: "Event Registration",
                    elements: [
                        { type: "text", name: "firstName", title: "First Name", isRequired: true },
                        { type: "text", name: "lastName", title: "Last Name", isRequired: true },
                        { type: "text", name: "email", title: "Email Address", inputType: "email", isRequired: true },
                        { type: "dropdown", name: "ticketType", title: "Ticket Type", choices: ["Early Bird", "Regular", "Student"], isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'speaker-application',
            name: 'Speaker Application',
            description: 'Conference speaker proposal and application form',
            features: ['Speaker bio', 'Topic proposal', 'Technical requirements', 'Availability'],
            surveyJson: {
                title: "Speaker Application",
                pages: [{
                    name: "speaker",
                    title: "Speaker Information",
                    elements: [
                        { type: "text", name: "speakerName", title: "Speaker Name", isRequired: true },
                        { type: "text", name: "email", title: "Email Address", inputType: "email", isRequired: true },
                        { type: "text", name: "presentationTitle", title: "Presentation Title", isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'venue-booking',
            name: 'Venue Booking',
            description: 'Event venue booking and requirements form',
            features: ['Event details', 'Capacity requirements', 'Equipment needs', 'Catering options'],
            surveyJson: {
                title: "Venue Booking Request",
                pages: [{
                    name: "booking",
                    title: "Event Details",
                    elements: [
                        { type: "text", name: "eventName", title: "Event Name", isRequired: true },
                        { type: "text", name: "organizerName", title: "Event Organizer", isRequired: true },
                        { type: "text", name: "eventDate", title: "Event Date", inputType: "date", isRequired: true }
                    ]
                }]
            }
        },
        {
            id: 'post-event-survey',
            name: 'Post-Event Survey',
            description: 'Event feedback and evaluation survey',
            features: ['Event rating', 'Session feedback', 'Venue assessment', 'Future suggestions'],
            surveyJson: {
                title: "Post-Event Survey",
                pages: [{
                    name: "feedback",
                    title: "Event Feedback",
                    elements: [
                        { type: "text", name: "eventName", title: "Event Name", isRequired: true },
                        { type: "rating", name: "overallRating", title: "Overall Event Rating", rateMin: 1, rateMax: 5, isRequired: true },
                        { type: "comment", name: "improvements", title: "What could be improved?" }
                    ]
                }]
            }
        },
        {
            id: 'vendor-application',
            name: 'Event Vendor Application',
            description: 'Vendor application for event participation',
            features: ['Vendor information', 'Services offered', 'Space requirements', 'Insurance details'],
            surveyJson: {
                title: "Event Vendor Application",
                pages: [{
                    name: "vendor",
                    title: "Vendor Information",
                    elements: [
                        { type: "text", name: "companyName", title: "Company Name", isRequired: true },
                        { type: "text", name: "contactPerson", title: "Contact Person", isRequired: true },
                        { type: "comment", name: "servicesOffered", title: "Services/Products Offered", isRequired: true }
                    ]
                }]
            }
        }
    ]
};

// Template library functions
function initializeTemplateLibrary() {
    const templateLibraryBtn = document.getElementById('templateLibraryBtn');
    const templateModal = document.getElementById('templateModal');
    const closeModalBtn = templateModal?.querySelector('.close');
    const categoryBtns = templateModal?.querySelectorAll('.category-btn');
    const searchInput = templateModal?.querySelector('#templateSearch');

    if (!templateLibraryBtn || !templateModal) return;

    templateLibraryBtn.addEventListener('click', () => {
        templateModal.style.display = 'block';
        loadTemplates('healthcare');
    });

    closeModalBtn?.addEventListener('click', () => {
        templateModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === templateModal) {
            templateModal.style.display = 'none';
        }
    });

    categoryBtns?.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.dataset.category;
            loadTemplates(category);
        });
    });

    searchInput?.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        filterTemplates(searchTerm);
    });
}

function loadTemplates(category) {
    const templatesContainer = document.getElementById('templatesContainer');
    if (!templatesContainer) return;

    templatesContainer.innerHTML = '';
    
    const templates = templateLibrary[category] || [];
    
    templates.forEach(template => {
        const templateCard = createTemplateCard(template);
        templatesContainer.appendChild(templateCard);
    });
}

function createTemplateCard(template) {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.innerHTML = `
        <div class="template-header">
            <h4>${template.name}</h4>
            <p class="template-description">${template.description}</p>
        </div>
        <div class="template-features">
            <strong>Features:</strong>
            <ul>
                ${template.features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
        </div>
        <div class="template-actions">
            <button class="btn btn-primary use-template-btn" data-template-id="${template.id}">
                Use This Template
            </button>
        </div>
    `;

    const useBtn = card.querySelector('.use-template-btn');
    useBtn.addEventListener('click', () => useTemplate(template));

    return card;
}

function filterTemplates(searchTerm) {
    const templateCards = document.querySelectorAll('.template-card');
    
    templateCards.forEach(card => {
        const title = card.querySelector('h4').textContent.toLowerCase();
        const description = card.querySelector('.template-description').textContent.toLowerCase();
        const features = card.querySelector('.template-features').textContent.toLowerCase();
        
        const matches = title.includes(searchTerm) ||
                       description.includes(searchTerm) ||
                       features.includes(searchTerm);
        
        card.style.display = matches ? 'block' : 'none';
    });
}

function useTemplate(template) {
    try {
        if (window.creator && template.surveyJson) {
            window.creator.JSON = template.surveyJson;
            
            // Close the modal
            const templateModal = document.getElementById('templateModal');
            if (templateModal) {
                templateModal.style.display = 'none';
            }
            
            // Show success notification
            showNotification(`Template "${template.name}" loaded successfully!`, 'success');
        } else {
            throw new Error('SurveyJS Creator not available or invalid template data');
        }
    } catch (error) {
        console.error('Error loading template:', error);
        showNotification('Error loading template. Please try again.', 'error');
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `template-notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button class="close-notification" onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initializeTemplateLibrary);

// Also initialize if script is loaded after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTemplateLibrary);
} else {
    initializeTemplateLibrary();
}