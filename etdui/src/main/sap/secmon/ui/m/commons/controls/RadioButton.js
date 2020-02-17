jQuery.sap.declare("sap.secmon.ui.m.commons.controls.RadioButton");
/**
 * This radiobutton extends the control sap.m.RadioButton by property "key".
 */
sap.m.RadioButton.extend("sap.secmon.ui.m.commons.controls.RadioButton", {

    metadata : {

        properties : {
            "key" : {
                type : "string"
            }
        }
    },

    init : function() {
        if (sap.m.RadioButton.prototype.init) {
            sap.m.RadioButton.prototype.init.apply(this, arguments);
        }
    },

    renderer : {
    // use parent renderer
    }

});