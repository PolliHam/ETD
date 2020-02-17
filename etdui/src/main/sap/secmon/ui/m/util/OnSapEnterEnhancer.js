jQuery.sap.declare("sap.secmon.ui.m.util.OnSapEnterEnhancer");

/**
 * this object is able to enhance  ui5-controls which have a onsapenter-functiton with a function which is
 * called after the user has typed the enter-key
 */
sap.secmon.ui.m.util.OnSapEnterEnhancer = (function() {
    return {

        enhance : function(aItems, enhancerFunction, thisArg) {
            aItems.forEach(function(oControl) {
                var fnOrigOnSapEnter = oControl.onsapenter;

                oControl.onsapenter = function() {
                    var sInputValBeforeDelegation = (this._getInputValue ? this._getInputValue() : undefined);
                    fnOrigOnSapEnter.apply(this, arguments);

                    enhancerFunction.call(thisArg, sInputValBeforeDelegation);
                }.bind(oControl);
            });
        }

    };
})();
