import { onRequestOptions as __api_auth_login_js_onRequestOptions } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\auth\\login.js"
import { onRequestPost as __api_auth_login_js_onRequestPost } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\auth\\login.js"
import { onRequestOptions as __api_auth_logout_js_onRequestOptions } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\auth\\logout.js"
import { onRequestPost as __api_auth_logout_js_onRequestPost } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\auth\\logout.js"
import { onRequestGet as __api_auth_me_js_onRequestGet } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\auth\\me.js"
import { onRequestOptions as __api_auth_me_js_onRequestOptions } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\auth\\me.js"
import { onRequestOptions as __api_auth_register_js_onRequestOptions } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\auth\\register.js"
import { onRequestPost as __api_auth_register_js_onRequestPost } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\auth\\register.js"
import { onRequestGet as __api_auth_session_js_onRequestGet } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\auth\\session.js"
import { onRequestOptions as __api_auth_session_js_onRequestOptions } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\auth\\session.js"
import { onRequestGet as __api_forms_render_js_onRequestGet } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\forms\\render.js"
import { onRequestOptions as __api_forms_render_js_onRequestOptions } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\forms\\render.js"
import { onRequestPost as __api_forms_render_js_onRequestPost } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\forms\\render.js"
import { onRequestDelete as __api_forms_submissions_js_onRequestDelete } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\forms\\submissions.js"
import { onRequestGet as __api_forms_submissions_js_onRequestGet } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\forms\\submissions.js"
import { onRequestOptions as __api_forms_submissions_js_onRequestOptions } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\forms\\submissions.js"
import { onRequestPost as __api_forms_submissions_js_onRequestPost } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\forms\\submissions.js"
import { onRequestDelete as __api_forms_templates_js_onRequestDelete } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\forms\\templates.js"
import { onRequestGet as __api_forms_templates_js_onRequestGet } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\forms\\templates.js"
import { onRequestOptions as __api_forms_templates_js_onRequestOptions } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\forms\\templates.js"
import { onRequestPost as __api_forms_templates_js_onRequestPost } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\forms\\templates.js"
import { onRequestPut as __api_forms_templates_js_onRequestPut } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\forms\\templates.js"
import { onRequest as __api_forms_analytics_js_onRequest } from "C:\\Users\\Peter Darley\\Desktop\\IPLC GitHub Eval\\functions\\api\\forms\\analytics.js"

export const routes = [
    {
      routePath: "/api/auth/login",
      mountPath: "/api/auth",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_auth_login_js_onRequestOptions],
    },
  {
      routePath: "/api/auth/login",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_login_js_onRequestPost],
    },
  {
      routePath: "/api/auth/logout",
      mountPath: "/api/auth",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_auth_logout_js_onRequestOptions],
    },
  {
      routePath: "/api/auth/logout",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_logout_js_onRequestPost],
    },
  {
      routePath: "/api/auth/me",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_me_js_onRequestGet],
    },
  {
      routePath: "/api/auth/me",
      mountPath: "/api/auth",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_auth_me_js_onRequestOptions],
    },
  {
      routePath: "/api/auth/register",
      mountPath: "/api/auth",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_auth_register_js_onRequestOptions],
    },
  {
      routePath: "/api/auth/register",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_register_js_onRequestPost],
    },
  {
      routePath: "/api/auth/session",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_session_js_onRequestGet],
    },
  {
      routePath: "/api/auth/session",
      mountPath: "/api/auth",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_auth_session_js_onRequestOptions],
    },
  {
      routePath: "/api/forms/render",
      mountPath: "/api/forms",
      method: "GET",
      middlewares: [],
      modules: [__api_forms_render_js_onRequestGet],
    },
  {
      routePath: "/api/forms/render",
      mountPath: "/api/forms",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_forms_render_js_onRequestOptions],
    },
  {
      routePath: "/api/forms/render",
      mountPath: "/api/forms",
      method: "POST",
      middlewares: [],
      modules: [__api_forms_render_js_onRequestPost],
    },
  {
      routePath: "/api/forms/submissions",
      mountPath: "/api/forms",
      method: "DELETE",
      middlewares: [],
      modules: [__api_forms_submissions_js_onRequestDelete],
    },
  {
      routePath: "/api/forms/submissions",
      mountPath: "/api/forms",
      method: "GET",
      middlewares: [],
      modules: [__api_forms_submissions_js_onRequestGet],
    },
  {
      routePath: "/api/forms/submissions",
      mountPath: "/api/forms",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_forms_submissions_js_onRequestOptions],
    },
  {
      routePath: "/api/forms/submissions",
      mountPath: "/api/forms",
      method: "POST",
      middlewares: [],
      modules: [__api_forms_submissions_js_onRequestPost],
    },
  {
      routePath: "/api/forms/templates",
      mountPath: "/api/forms",
      method: "DELETE",
      middlewares: [],
      modules: [__api_forms_templates_js_onRequestDelete],
    },
  {
      routePath: "/api/forms/templates",
      mountPath: "/api/forms",
      method: "GET",
      middlewares: [],
      modules: [__api_forms_templates_js_onRequestGet],
    },
  {
      routePath: "/api/forms/templates",
      mountPath: "/api/forms",
      method: "OPTIONS",
      middlewares: [],
      modules: [__api_forms_templates_js_onRequestOptions],
    },
  {
      routePath: "/api/forms/templates",
      mountPath: "/api/forms",
      method: "POST",
      middlewares: [],
      modules: [__api_forms_templates_js_onRequestPost],
    },
  {
      routePath: "/api/forms/templates",
      mountPath: "/api/forms",
      method: "PUT",
      middlewares: [],
      modules: [__api_forms_templates_js_onRequestPut],
    },
  {
      routePath: "/api/forms/analytics",
      mountPath: "/api/forms",
      method: "",
      middlewares: [],
      modules: [__api_forms_analytics_js_onRequest],
    },
  ]