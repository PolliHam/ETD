sap.ui.define([ "sap/m/MultiInput" ], function(MultiInput) {
    "use strict";
    return MultiInput.extend("sap.secmon.ui.m.commons.controls.MultiInput", {
        metadata : {
            properties : {
                tokenData : {
                    type : "object[]",
                    defaultValue : []
                }
            },
        },

        renderer : {},

        rebind : function() {
            var oBindingInfo = this.getBindingInfo("tokens");
            // oBindingInfo.templateShareable = true;
            // var oTemplate = tokenBindingInfo.template || tokenBindingInfo.factory;

            var oTemplate = new sap.m.Token({
                text : "TEXT",
                key : "KEY"
            });
            if (oBindingInfo) {
                this.bindAggregation("tokens", {
                    path : "TargetAttributeIds",
                    model : "RunJSONModel",
                    template : oTemplate, // oBindingInfo.template || oTokenTemplate,
                    templateShareable : false
                });
                // oBindingInfo.model
                this.getModel().refresh(false);
            }
        },

        init : function() {
            if (MultiInput.prototype.init) {
                MultiInput.prototype.init.apply(this, arguments);
            }
            // this.rebind.apply(this);
        },

        onBeforeRendering : function(oEvent) {

            if (MultiInput.prototype.onBeforeRendering) {
                MultiInput.prototype.onBeforeRendering.apply(this, arguments);
            }
            this.rebind.apply(this);
        }
    });

});
