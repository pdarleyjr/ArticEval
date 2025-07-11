// Preview Component for Form Builder

class Preview {
    constructor(formBuilder) {
        this.formBuilder = formBuilder;
    }

    show() {
        // Logic to create and show preview modal
        // Extracted from monolith: inject CSS, create modal, initialize SurveyJS, cleanup design elements
        console.log('Showing preview');
    }

    close() {
        // Logic to close preview and cleanup
    }

    injectBuilderCSS() {
        // CSS injection logic
    }

    // Other preview-related methods
}

export default Preview;