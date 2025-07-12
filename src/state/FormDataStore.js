// Form Data Store

class FormDataStore {
  constructor(initialData = {}) {
    this.data = {
      title: '',
      description: '',
      pages: [
        {
          name: 'page1',
          title: 'Page 1',
          elements: []
        }
      ],
      ...initialData
    };
  }

  getFormData() {
    return JSON.parse(JSON.stringify(this.data));
  }

  updateFormData(newData) {
    this.data = { ...this.data, ...newData };
  }

  getCurrentPage() {
    return this.data.pages[this.formBuilder?.currentPageIndex || 0]; // Assuming formBuilder reference
  }

  addElementToCurrentPage(element) {
    const currentPage = this.getCurrentPage();
    currentPage.elements.push(element);
  }

  // Other data manipulation methods
}

export default FormDataStore;
