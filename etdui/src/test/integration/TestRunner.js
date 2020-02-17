(function (window) {
    function TestRunner(sJourneyPath) {
        this.sJourneyPath = sJourneyPath;

        this.run = function () {
            sap.ui.require([
                this.sJourneyPath
            ], function (oTest) {
                "use strict";
                this.done = false;
            });
        }.bind(this);

        return this;
    }

    // We need that our library is globally accesible, then we save in the window
    if (typeof(window.TestRunner) === 'undefined') {
        window.TestRunner = TestRunner;
    }
})(window);
