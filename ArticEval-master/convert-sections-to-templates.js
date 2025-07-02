/**
 * Convert HTML evaluation sections to JSON form templates
 * This script converts the backup HTML sections into JSON form templates
 * that can be imported into the form builder system
 */

const fs = require('fs');
const path = require('path');

// Template metadata for each section
const sectionMetadata = {
    'patient-info': {
        name: 'Patient Information',
        description: 'Patient demographic and evaluation header information',
        category: 'header',
        order: 1
    },
    'protocol': {
        name: 'Articulation Evaluation Protocol', 
        description: 'Evaluation protocol overview and component selection',
        category: 'assessment',
        order: 2
    },
    'background-info': {
        name: 'Relevant Background Information',
        description: 'Comprehensive background history including birth, medical, and developmental information',
        category: 'history',
        order: 3
    },
    'oral-mechanism': {
        name: 'Oral Mechanism Evaluation',
        description: 'Assessment of oral speech mechanism structure and function',
        category: 'assessment',
        order: 4
    },
    'speech-sound': {
        name: 'Speech Sound Assessment',
        description: 'Comprehensive phoneme assessment with detailed error analysis',
        category: 'assessment',
        order: 5
    },
    'language-sample': {
        name: 'Language Sample Analysis',
        description: 'Analysis of spontaneous language including structure, content, and social use',
        category: 'assessment',
        order: 6
    },
    'speech-sample': {
        name: 'Speech Sample Analysis', 
        description: 'Connected speech analysis with intelligibility ratings and error patterns',
        category: 'assessment',
        order: 7
    },
    'standardized-assessment': {
        name: 'Standardized Assessment',
        description: 'Formal standardized test results with scoring interpretation',
        category: 'assessment',
        order: 8
    },
    'clinical-impressions': {
        name: 'Clinical Impressions',
        description: 'Clinical summary and prognosis',
        category: 'summary',
        order: 9
    },
    'recommendations': {
        name: 'Recommendations',
        description: 'Treatment recommendations and referrals',
        category: 'summary',
        order: 10
    }
};

function convertHtmlToFormTemplate(htmlContent, sectionKey) {
    const metadata = sectionMetadata[sectionKey];
    
    return {
        id: `default-${sectionKey}`,
        name: metadata.name,
        description: metadata.description,
        category: metadata.category,
        version: '1.0.0',
        created_by: 'system',
        is_default: true,
        order: metadata.order,
        fields: extractFieldsFromHtml(htmlContent),
        html_template: htmlContent,
        styling: {
            theme: 'clinical',
            print_optimized: true,
            responsive: true
        },
        scoring: {
            enabled: false,
            method: 'manual'
        },
        validation: {
            required_fields: extractRequiredFields(htmlContent),
            custom_rules: []
        }
    };
}

function extractFieldsFromHtml(htmlContent) {
    const fields = [];
    
    // Extract input fields
    const inputRegex = /<input[^>]*>/g;
    const inputs = htmlContent.match(inputRegex) || [];
    
    inputs.forEach(input => {
        const idMatch = input.match(/id="([^"]*)"/);
        const typeMatch = input.match(/type="([^"]*)"/);
        const nameMatch = input.match(/name="([^"]*)"/) || input.match(/id="([^"]*)"/) ;
        const requiredMatch = input.match(/required/);
        
        if (idMatch) {
            fields.push({
                id: idMatch[1],
                type: typeMatch ? typeMatch[1] : 'text',
                name: nameMatch ? nameMatch[1] : idMatch[1],
                required: !!requiredMatch,
                validation: []
            });
        }
    });
    
    // Extract textarea fields
    const textareaRegex = /<textarea[^>]*id="([^"]*)"[^>]*>/g;
    let textareaMatch;
    while ((textareaMatch = textareaRegex.exec(htmlContent)) !== null) {
        fields.push({
            id: textareaMatch[1],
            type: 'textarea',
            name: textareaMatch[1],
            required: false,
            validation: []
        });
    }
    
    // Extract select fields
    const selectRegex = /<select[^>]*id="([^"]*)"[^>]*>/g;
    let selectMatch;
    while ((selectMatch = selectRegex.exec(htmlContent)) !== null) {
        fields.push({
            id: selectMatch[1],
            type: 'select',
            name: selectMatch[1],
            required: false,
            validation: []
        });
    }
    
    return fields;
}

function extractRequiredFields(htmlContent) {
    const requiredFields = [];
    const requiredRegex = /<input[^>]*required[^>]*id="([^"]*)"[^>]*>/g;
    let match;
    while ((match = requiredRegex.exec(htmlContent)) !== null) {
        requiredFields.push(match[1]);
    }
    return requiredFields;
}

// Convert all sections
async function convertAllSections() {
    const sectionsDir = path.join(__dirname, '..', 'backup', 'sections');
    const outputDir = path.join(__dirname, 'default-templates');
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const templates = [];
    
    // Process each section file
    for (const [sectionKey, metadata] of Object.entries(sectionMetadata)) {
        const filename = `${sectionKey}.html`;
        const filePath = path.join(sectionsDir, filename);
        
        if (fs.existsSync(filePath)) {
            console.log(`Converting ${filename}...`);
            
            const htmlContent = fs.readFileSync(filePath, 'utf8');
            const template = convertHtmlToFormTemplate(htmlContent, sectionKey);
            
            // Save individual template file
            const outputPath = path.join(outputDir, `${sectionKey}.json`);
            fs.writeFileSync(outputPath, JSON.stringify(template, null, 2));
            
            templates.push(template);
            console.log(`✓ Created ${sectionKey}.json`);
        } else {
            console.log(`⚠ Warning: ${filename} not found`);
        }
    }
    
    // Create combined templates file
    const combinedPath = path.join(outputDir, 'all-templates.json');
    fs.writeFileSync(combinedPath, JSON.stringify(templates, null, 2));
    
    console.log(`\n✓ Conversion complete! Created ${templates.length} templates`);
    console.log(`📁 Templates saved to: ${outputDir}`);
    console.log(`📄 Combined file: all-templates.json`);
    
    return templates;
}

// Run conversion if called directly
if (require.main === module) {
    convertAllSections().catch(console.error);
}

module.exports = { convertAllSections, convertHtmlToFormTemplate };