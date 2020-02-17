sap.ui.vbm.LegendItem.extend("sap.secmon.ui.m.commons.controls.VbmLegendItem", {

    /**
     * In SAPUI5 1.28 the legend in a VBM map does not allow clicks. This
     * control adds this functionality. This control can be removed in later
     * releases.
     */
    metadata : {

        events : {
            "click" : {
                enablePreventDefault : false
            }
        }
    },

    _onPress : function(oEvent) {
        this.fireClick();
    },

    init : function() {
        if (sap.ui.core.Control.prototype.init) {
            sap.ui.core.Control.prototype.init.apply(this, arguments);
        }

    }

});
