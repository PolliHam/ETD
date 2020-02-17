jQuery.sap.declare("sap.secmon.ui.m.anomaly.ui.library");
jQuery.sap.require("sap.ui.core.Core");

// library dependencies
jQuery.sap.require("sap.ui.core.library");
// jQuery.sap.require("sap.ui.thirdparty.jqueryui.jquery-ui-sortable");
// jQuery.sap.require("sap.ui.thirdparty.jqueryui.jquery-ui-draggable");
// jQuery.sap.require("sap.ui.thirdparty.jqueryui.jquery-ui-droppable");
// jQuery.sap.require("sap.ui.thirdparty.jqueryui.jquery-ui-resizable");

/** @namespace sap.secmon.ui.anomaly */

// delegate further initialization of this library to the Core
sap.ui.getCore().initLibrary({
    name : "sap.secmon.ui.m.anomaly.ui",
    dependencies : [ "sap.ui.core" ],
    types : [],
    interfaces : [],
    controls : [],
    elements : [],
    version : "1.0.0"
});