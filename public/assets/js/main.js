// Import the CSS for SurveyJS Creator and the core library
import "survey-creator-core/survey-creator-core.min.css";
import { SurveyCreatorModel } from "survey-creator-core";

// This is the UI package, which adds the .render() method to the SurveyCreatorModel
import "survey-creator-js";

// Make the SurveyCreatorModel available on the window object so the inline script in builder.html can access it.
window.SurveyCreatorCore = {
    SurveyCreatorModel
};