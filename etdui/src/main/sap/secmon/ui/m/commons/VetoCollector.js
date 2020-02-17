jQuery.sap.declare("sap.secmon.ui.m.commons.VetoCollector");

sap.ui.base.Object.extend("sap.secmon.ui.m.commons.VetoCollector", {
    /**
     * C'tor
     */
    constructor: function() {
        this.vetoParties = [];
    },

    /**
     * registers the spcecified callback and its context which is
     * being called when noVetoExists is called
     *
     * @param fnCallback callback function; the result of the function influences the veto;
     *    the result of the function may be a deferred object, an object or a boolean;
     *    a rejected deferred object, false, undefined or null leads to a veto
     * @param oContext owner of the function
     */
    register : function(fnCallback, oContext) {
        this.vetoParties.push({callback : fnCallback, context : oContext});
    },

    /**
     * disposes the registered parties which can contribute to a veto
     */
    dispose : function() {
        this.vetoParties.length = 0;
    },

    /**
     * checks that no registered party has a veto against an action.
     * this function returns a deferred object to handle the
     * result.
     *
     * @returns Deferred Object which can be used to ensure that no party
     * has a veto against an action
     */
    noVetoExists : function() {
        var aPromises = [];

        if (this.vetoParties.length === 0) {
            var oDeferred = $.Deferred();
            oDeferred.resolve();

            aPromises.push(oDeferred);
        } else {
            this.vetoParties.forEach(function(oVetoParty) {
                var result  = oVetoParty.callback.apply(oVetoParty.context);

                // if it is a promise (way how jquery does it)
                if (result && jQuery.isFunction( result.promise )) {
                    aPromises.push(result);
                } else {
                    // if not it has to evaluate to true
                    var resultPromise = $.Deferred();
                    if (result) {
                        resultPromise.resolve();
                    } else {
                        resultPromise.reject();
                    }

                    aPromises.push(resultPromise);
                }
            });
        }

        return $.when.apply($, aPromises);
    }
});

