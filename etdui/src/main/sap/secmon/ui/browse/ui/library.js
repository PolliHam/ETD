jQuery.sap.declare("sap.secmon.ui.browse.library");
jQuery.sap.require("sap.ui.core.Core");

// library dependencies
jQuery.sap.require("sap.ui.core.library");
// jQuery.sap.require("sap.ui.thirdparty.jqueryui.jquery-ui-sortable");
// jQuery.sap.require("sap.ui.thirdparty.jqueryui.jquery-ui-draggable");
// jQuery.sap.require("sap.ui.thirdparty.jqueryui.jquery-ui-droppable");
// jQuery.sap.require("sap.ui.thirdparty.jqueryui.jquery-ui-resizable");

/** @namespace sap.secmon.ui.browse */

// delegate further initialization of this library to the Core
sap.ui.getCore().initLibrary(
        {
            name : "sap.secmon.ui.browse",
            dependencies : [ "sap.ui.core" ],
            types : [],
            interfaces : [],
            controls : [ "sap.secmon.ui.browse.AbstractValueSelector", "sap.secmon.ui.browse.BrowsingChart", "sap.secmon.ui.browse.GeneralFilterCard", "sap.secmon.ui.browse.DependsOnSubsetCard",
                    "sap.secmon.ui.browse.TimeRange", "sap.secmon.ui.browse.Path", "sap.secmon.ui.browse.Filter", "sap.secmon.ui.browse.Workspace", "sap.secmon.ui.browse.Chart",
                    "sap.secmon.ui.browse.FilterCard" ],
            elements : [],
            version : "1.0.0"
        });