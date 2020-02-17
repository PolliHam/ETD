jQuery.sap.require("sap.secmon.ui.m.commons.VetoCollector");

describe("VetoCollector", function() {
    var vetoCollector;

    var success = function() {
        expect(true).toBeTruthy();
    };
    var failure = function() {
        expect(false).toBeTruthy();
    };

    beforeEach(function() {
        vetoCollector = new sap.secmon.ui.m.commons.VetoCollector();
    });

    it("should resolve if not veto parties exist", function() {
        vetoCollector.noVetoExists().then(success).fail(failure);
    });

    it("should keep the promise if a party has no veto which is a deferred object", function() {
        var oVetoParty = {
            isAllowed : function() {
                var deferred = $.Deferred();
                deferred.resolve();

                return deferred;
            }
        };

        vetoCollector.register(oVetoParty.isAllowed, oVetoParty);
        expect(vetoCollector.vetoParties.length).toBe(1);

        vetoCollector.noVetoExists().then(success).fail(failure);
    });

    it("should NOT keep the promise if a party has a veto which is a deferred object", function() {
        var oVetoParty = {
            isAllowed : function() {
                var deferred = $.Deferred();
                deferred.reject();

                return deferred;
            }
        };

        vetoCollector.register(oVetoParty.isAllowed, oVetoParty);
        expect(vetoCollector.vetoParties.length).toBe(1);

        vetoCollector.noVetoExists().then(failure).fail(success);
    });

    it("should keep the promise if a party has no veto which is not a deferred object", function() {
        var oVetoParty = {
            isAllowed : function() {
                return true;
            }
        };

        vetoCollector.register(oVetoParty.isAllowed, oVetoParty);
        expect(vetoCollector.vetoParties.length).toBe(1);

        vetoCollector.noVetoExists().then(success).fail(failure);

        // change isAllowed so that it returns an object
        vetoCollector.dispose();
        oVetoParty.isAllowed = function() { return {};};
        vetoCollector.register(oVetoParty.isAllowed, oVetoParty);

        vetoCollector.noVetoExists().then(success).fail(failure);
    });

    it("should NOT keep the promise if a party has a veto which is not a deferred object", function() {
        var oVetoParty = {
            isAllowed : function() {
                return false;
            }
        };

        vetoCollector.register(oVetoParty.isAllowed, oVetoParty);
        expect(vetoCollector.vetoParties.length).toBe(1);

        vetoCollector.noVetoExists().then(failure).fail(success);

        // change isAllowed so that it returns undefined
        vetoCollector.dispose();
        oVetoParty.isAllowed = function() {};
        vetoCollector.register(oVetoParty.isAllowed, oVetoParty);
        vetoCollector.noVetoExists().then(failure).fail(success);

        // change isAllowed so that it returns null
        vetoCollector.dispose();
        oVetoParty.isAllowed = function() {
            return null;
        };
        vetoCollector.register(oVetoParty.isAllowed, oVetoParty);

        vetoCollector.noVetoExists().then(failure).fail(success);
    });

    it("should keep the promise if no party has a veto where the result is a combination of deferred object and non-deferred object", function() {
        var oVetoPartyOne = {
            isAllowed : function() {
                return true;
            }
        };
        var oVetoPartyTwo = {
            isAllowed : function() {
                var deferred = $.Deferred();
                deferred.resolve();

                return deferred;
            }
        };
        var oVetoPartyThree = {
            isAllowed : function() {
                return {};
            }
        };

        vetoCollector.register(oVetoPartyOne.isAllowed, oVetoPartyOne);
        vetoCollector.register(oVetoPartyTwo.isAllowed, oVetoPartyTwo);
        vetoCollector.register(oVetoPartyThree.isAllowed, oVetoPartyThree);
        expect(vetoCollector.vetoParties.length).toBe(3);

        vetoCollector.noVetoExists().then(success).fail(failure);
    });

    it("should NOT keep the promise if one party has a veto where the result is a combination of deferred object and non-deferred object", function() {
        var oVetoPartyOne = {
            isAllowed : function() {
                return false;
            }
        };
        var oVetoPartyTwo = {
            isAllowed : function() {
                var deferred = $.Deferred();
                deferred.resolve();

                return deferred;
            }
        };

        vetoCollector.register(oVetoPartyOne.isAllowed, oVetoPartyOne);
        vetoCollector.register(oVetoPartyTwo.isAllowed, oVetoPartyTwo);
        expect(vetoCollector.vetoParties.length).toBe(2);

        vetoCollector.noVetoExists().then(failure).fail(success);
    });
});