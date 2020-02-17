jQuery.sap.declare("sap.secmon.ui.m.valuelist.util.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.commons.Privileges");
/**
 * Make some formatters globally available.
 */
sap.secmon.ui.m.valuelist.util.Formatter = {

    oCommons : new sap.secmon.ui.commons.CommonFunctions(),
    /**
     * Determines if specified namespace is a system namespace
     */
    isSystemNamespaceFormatter : function(currentNameSpace) {
        if (currentNameSpace === undefined || currentNameSpace === null) {
            return null;
        }
        var nameSpaceModel = this.getModel("nameSpaces");
        var aNamespaces = nameSpaceModel.getData().NameSpaces;
        if (aNamespaces.length > 0) {
            for (var i = 0; i < aNamespaces.length; i++) {
                var namespace = aNamespaces[i].NameSpace;
                if (namespace === currentNameSpace) {
                    return true;
                }
            }
        } else {
            return null;
        }
        return false;
    },

    isSystemNsAndDisplayMode : function(currentNameSpace, displayMode) {
        if (currentNameSpace === undefined || currentNameSpace === null) {
            return null;
        }
        if (displayMode === true) {
            return sap.secmon.ui.m.valuelist.util.Formatter.isSystemNamespaceFormatter.call(this, currentNameSpace);
        }
        return false;
    },

    isSystemNsAndUpdatemodAndEditMode : function(currentNameSpace, updateMode, editMode) {
        if (currentNameSpace === undefined || currentNameSpace === null ||  updateMode !== "MANUAL") {
            return false;
        }
        if (editMode === true) {
            return sap.secmon.ui.m.valuelist.util.Formatter.isSystemNamespaceFormatter.call(this, currentNameSpace);
        }
        return false;
    },

    /**
     * used for removal of all values, button "Remove All". If the valuelist is in update mode "manual": All values can be removed (if in "Display" mode). If the value list is in update mode
     * "automated": Only values from a foreign namespace can be removed. Here, the button is only enabled if all values are foreign values.
     */
    hasOnlyForeignNamespaceInDisplayMode : function(displayMode, updateMode, localNamespacesCount, valueCount) {
        if (displayMode !== true) {
            return false;
        }
        if (updateMode === "AUTOMATED") {
            return (localNamespacesCount === 0 && valueCount > 0);
        }
        if (!updateMode || updateMode === "MANUAL") {
            return (valueCount > 0);
        }

        return false;
    },

    /**
     * used for removal of selected values, buton "Remove". If the valuelist is in update mode "manual": All selected values can be removed (if in "Display" mode). If the value list is in update mode
     * "automated": Only values from a foreign namespace can be removed. In either case, at least 1 value must be selected.
     */
    hasForeignNamespaceInDisplayMode : function(displayMode, updateMode, foreignNamespacesCount, valueCount, selectedCount) {
        if (displayMode !== true) {
            return false;
        }
        if (selectedCount === 0){
            return false;
        }
        if (updateMode === "AUTOMATED") {
            return (foreignNamespacesCount > 0 && valueCount > 0);
        }
        if (!updateMode || updateMode === "MANUAL") {
            return (valueCount > 0);
        }
        return false;
    },

    /**
     * returns true if - header or values are from a local namespace - the UI is in Display mode and the update mode is "manual"
     */
    hasLocalNamespaceAndDisplayMode : function(displayMode, localNamespacesCount, authorized) {
	return authorized === true && localNamespacesCount > 0 && displayMode === true ;
    },

    /**
     * returns true if the UI is in Display mode and the update mode is "manual"
     */
    isDisplayAndManualUpdateMode : function(displayMode, updateMode, authorized) {
        return authorized === true && displayMode === true && updateMode !== 'AUTOMATED';
    },

    /**
     * enabledness of checkboxes: Returns true if the UI is in Display mode. If the update mode is MANUAL, any value can be selected. If the update ode is AUTOMATED, only foreign values are selectable
     */
    isDisplayAndManualUpdateModeInForeignNS : function(displayMode, updateMode, currentNameSpace) {
        if (displayMode !== true) {
            return false;
        }
        if (updateMode !== 'AUTOMATED') {
            return true;
        }
        if (!currentNameSpace) {
            return false;
        }
        return !sap.secmon.ui.m.valuelist.util.Formatter.isSystemNamespaceFormatter.call(this, currentNameSpace);
    },

    isSystemNsAndNotUsed : function(currentNameSpace, authorized, array) {
	if (!authorized){
	    return false;
	}
        if (array !== null && array !== undefined) {
            if (array.length === 0) {
                return sap.secmon.ui.m.valuelist.util.Formatter.isSystemNamespaceFormatter.call(this, currentNameSpace);
            } else {
                return false;
            }
        }
        return sap.secmon.ui.m.valuelist.util.Formatter.isSystemNamespaceFormatter.call(this, currentNameSpace);
    },

    /**
     * Returns specified namespace if it is system namespace
     */
    defaultNamespaceFormatter : function(currentNameSpace) {
        if (currentNameSpace === undefined || currentNameSpace === null) {
            return null;
        }
        var nameSpaceModel = this.getModel("nameSpaces");
        var aNamespaces = nameSpaceModel.getData().NameSpaces;
        for (var i = 0; i < aNamespaces.length; i++) {
            var namespace = aNamespaces[i].NameSpace;
            if (namespace === currentNameSpace) {
                return currentNameSpace;
            }
        }

    },

    tableModeFormatter : function(displayMode, bAuthorized) {
        if (displayMode === true && bAuthorized === true) {
            return 'MultiSelect';
        } else {
            return 'None';
        }
    },

    // this formatter is needed because otherwise all checkboxes are checked if
    // you check the first one and then switch to editmode
    uncheckCheckBox : function(editMode, updateMode) {
        // Caution: The parameters are needed to trigger a change event
        // when changing edit mode or update mode
        return false;

    },

    valuesExist : function(valueCount) {
        return (valueCount > 0);
    },
    
    valuesExistAndSelected : function(valueCount, selectedCount) {
        return (valueCount > 0 && selectedCount > 0);
    },

    setLineType : function(displayMode, published) {
        if (displayMode === true && parseInt(published) === 1) {
            return "Navigation";
        } else {
            return "Inactive";
        }

    },

    publishedFormatter : function(published, sYes, sNo) {
        if (parseInt(published) === 1) {
            return sYes;
        }
        return sNo;
    },

    fillFromEventsConfirmButonEnabledFormatter : function(enumKey) {
        if (enumKey !== undefined && enumKey !== null) {
            return true;
        }
        return false;
    },

    updateUrlFormatter : function(rawGuid) {
        // careful: protocol ends with colon, e.g. "http:"
        var baseUrl = location.protocol + "//" + location.host;
        var hexGuid = sap.secmon.ui.m.valuelist.util.Formatter.oCommons.base64ToHex(rawGuid);
        return baseUrl + "/sap/secmon/services/api/valuelist/" + hexGuid;
    },
    
    updateModeFormatter : function(updateModeKey, updateModeFallbackName) {
	updateModeKey = updateModeKey || 'MANUAL';
	
	var longKey = "/sap.secmon.ui.m.valuelist/ValueList/UpdateMode/keyValueMap/" + updateModeKey;
        var model = this.getModel("enums"), text = model.getProperty(longKey);
        if (text === updateModeKey) {
            return updateModeFallbackName;
        }
        return text;
    }

};
