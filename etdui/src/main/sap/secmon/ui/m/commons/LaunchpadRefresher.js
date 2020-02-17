jQuery.sap.declare("sap.secmon.ui.m.commons.LaunchpadRefresher");

jQuery.sap.require("sap.ui.core.routing.HashChanger");

/**
 * This helper object is used for refreshing the launchpad if the user comes back to the launchpad-page. The helper-object has to be installed only once by calling 'ensureHookIsInstalled'. After that
 * all navigation (clicking home, back, etc.) to the launchpad-page is triggering a refresh of all tiles.
 */
sap.secmon.ui.m.commons.LaunchpadRefresher = (function() {

    var fnHandleHashChange;

    return {
        ensureHookIsInstalled : function() {
            if (!fnHandleHashChange) {
                fnHandleHashChange = function(e) {
                    // "sap.ui.core.routing.HashChanger" is not working as intended
                    // Therefore we refresh if no hash exists and if a Hash exists no characters are after the hash
                    var aNewLaunchpad = e.newURL.split('#');

                    if (aNewLaunchpad.length === 1 || aNewLaunchpad.length === 2 && aNewLaunchpad[1].length === 0) {
                        var oLaunchPage = sap.ushell.Container.getService("LaunchPage");
                        // re-load home-group of user; hereby the default group
                        // has to be fetched before loading
                        // the group otherwise the group is still invisible
                        oLaunchPage.getDefaultGroup().done(function(oGroup) {
                            sap.ushell.renderers.fiori2.launchpad.getDashboardManager().loadPersonalizedGroups();
                        });
                    }

                };

                // add an event handler for general hash changes; see
                // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onhashchange
                window.addEventListener("hashchange", fnHandleHashChange, false);
            }
        }

    };

})();