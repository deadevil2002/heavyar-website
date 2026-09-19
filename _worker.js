import { handleRequest } from './src/handler.mjs';

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};