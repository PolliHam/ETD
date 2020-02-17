jQuery.sap.registerModulePath("sap.secmon.ui", "/sap/secmon/ui");
jQuery.sap.require("sap.secmon.ui.m.commons.NavigationService");
window.location.replace("/sap/hana/uis/clients/ushell-app/shells/fiori/FioriLaunchpad.html?siteId=sap.secmon.ui.mobile.launchpad|ETDLaunchpad" +
sap.secmon.ui.m.commons.NavigationService.getLanguage());