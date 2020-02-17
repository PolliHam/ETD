/*!
 * ${copyright}
 */

/**
 * Initialization Code and shared classes of library sap.secmon.ui.commons.
 */
sap.ui.define([ 'jquery.sap.global', 'sap/ui/core/library' ], // library dependency
function(jQuery) {

    "use strict";

    /**
     * Suite controls library.
     * 
     * @namespace
     * @name sap.secmon.ui.commons
     * @author SAP SE
     * @version ${version}
     * @public
     */

    // delegate further initialization of this library to the Core
    sap.ui.getCore().initLibrary(
            {
                name : "sap.secmon.ui.commons",
                version : "${version}",
                dependencies : [ "sap.ui.core" ],
                types : [ "sap.secmon.ui.commons.Dimensions" ],
                interfaces : [],
                controls : [ "sap.secmon.ui.commons.controls.AlertForceDirectedGraph", "sap.secmon.ui.commons.controls.ForceDirectedGraph", "sap.secmon.ui.commons.controls.GlobalMessageButton",
                        "sap.secmon.ui.commons.controls.Legend", "sap.secmon.ui.commons.controls.LegendIcon", "sap.secmon.ui.commons.controls.LongTapLink", "sap.secmon.ui.commons.controls.Tooltip",
                        "sap.secmon.ui.commons.controls.TooltipItem" ],
                elements : []
            });

    /**
     * Some dimension IDs in HEX format
     */
    jQuery.sap.declare("sap.secmon.ui.commons.Dimensions");
    sap.secmon.ui.commons.Dimensions = {
        // system IDs
        SYSTEM_ID_ACTOR : "53CDE60D0DC572EEE10000000A4CF109",
        SYSTEM_ID_INITIATOR : "56424E6B1B2FA51BE22A044B51CC7B4D",
        SYSTEM_ID_INTERMEDIARY : "56424E6C1B2FA51BE22A044B51CC7B4D",
        SYSTEM_ID_REPORTER : "556C7ECA56D9AC24E10000000A4CF109",
        SYSTEM_ID_TARGET : "5417E3D7F2E52F66E10000000A4CF109",

        // system types
        SYSTEM_TYPE_ACTOR : "53CDE60B0DC572EEE10000000A4CF109",
        SYSTEM_TYPE_INITIATOR : "56424E6D1B2FA51BE22A044B51CC7B4D",
        SYSTEM_TYPE_INTERMEDIARY : "56424E6E1B2FA51BE22A044B51CC7B4D",
        SYSTEM_TYPE_REPORTER : "556C7EC956D9AC24E10000000A4CF109",
        SYSTEM_TYPE_TARGET : "5417E3D4F2E52F66E10000000A4CF109",

        // user pseudonyms
        USER_PSEUDONYM_ACTING : "53D8FCF497FB1B2EE10000000A4CF109",
        USER_PSEUDONYM_INITIATING : "56424E7F1B2FA51BE22A044B51CC7B4D",
        USER_PSEUDONYM_TARGETED : "56424E801B2FA51BE22A044B51CC7B4D",
        USER_PSEUDONYM_TARGETING : "53EE56531AA9066CE10000000A4CF109"
    };

    return sap.secmon.ui.commons;

}, /* bExport= */false);