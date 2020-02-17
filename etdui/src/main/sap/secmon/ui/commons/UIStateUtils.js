jQuery.sap.declare("sap.secmon.ui.commons.UIStateUtils");

/**
 * Utilities for saving / retrieving UI state in the browser session
 * 
 */
sap.secmon.ui.commons.UIStateUtils = {

    createUIStateId : function() {
        return jQuery.sap.uid();
    },

    putUIState : function(uiStateId, oState) {
        jQuery.sap.storage.put(uiStateId, JSON.stringify(oState));
    },

    getUIState : function(uiStateId) {
        var sState = jQuery.sap.storage.get(uiStateId);
        if (!sState) {
            return null;
        }
        return JSON.parse(sState);
    }
};
