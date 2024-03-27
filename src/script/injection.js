import { POST_MESSAGE } from "./constatnt"

;(() => {
  if(window.___ani_baha_plugin__) {
    return
  }

  ;(function(history){
    const pushState = history.pushState
    history.pushState = function(state) {
      if (typeof history.onpushstate =="function") {
        try {
          history.onpushstate({state: state})
        }catch(e){}
      }
      return pushState.apply(history, arguments)
    }

    const popState = window.onpopstate
    window.onpopstate = function(e) {
      if(typeof window._onpopstate == "function") {
        try {
          window._onpopstate(e)
        }catch(e){}
        return popState.apply(window, arguments)
      }
    }
  })(window.history)

  window.___ani_baha_plugin__ = true

  const handle = function() {
    window.postMessage(POST_MESSAGE, "*")
  }

  window.history.onpushstate = handle
  window._onpopstate = handle
})()
