jQuery.sap.declare("sap.secmon.ui.m.alerts.util.CompactTriggerHelper");
jQuery.sap.require("sap.secmon.ui.commons.Dimensions");

sap.secmon.ui.m.alerts.util.CompactTriggerHelper = {
    /**
     * Convert the Details list into a compact form: two lines for system ID and system type are merged into one line
     */
    compactifyDetails : function(controller, detailsModel, i18nModel, path) {
        var oController = controller, oDetailsModel = detailsModel;
        var i18n = i18nModel;
        var model = controller.getView().getModel();

        model.read(path, {
            success : function(oData) {
                sap.secmon.ui.m.alerts.util.CompactTriggerHelper.compactifyDetailsModelReady(oController, oData.results, oDetailsModel, i18n);
            }
        });

    },

    compactifyDetailsModelReady : function(oController, aDetails, detailModel, i18nModel, knowledgeModel) {
        var controller = oController;
        var Dimensions = sap.secmon.ui.commons.Dimensions;
        var aCompactedDetails = [], i18n = i18nModel;

        aDetails.forEach(function(oDetail) {
            var dimIdAsHex = controller.oCommons.base64ToHex(oDetail.DimensionId);
            switch (dimIdAsHex) {
            case Dimensions.SYSTEM_TYPE_ACTOR:
                break;
            case Dimensions.SYSTEM_TYPE_INITIATOR:
                break;
            case Dimensions.SYSTEM_TYPE_INTERMEDIARY:
                break;
            case Dimensions.SYSTEM_TYPE_REPORTER:
                break;
            case Dimensions.SYSTEM_TYPE_TARGET:
                break;
            default:
                oDetail.DisplayKey = oDetail.DisplayKey;
                aCompactedDetails.push(oDetail);
            }
        });

        function addTypeInfo(detailWithTypeInfo, systemDimensionIdInHexFormat) {
            var aElements = aCompactedDetails.filter(function(element) {
                return controller.oCommons.base64ToHex(element.DimensionId) === systemDimensionIdInHexFormat;
            });
            if (aElements.length > 0) {
                aElements.forEach(function(compactedDetail) {
                    compactedDetail.typeDimensionId = detailWithTypeInfo.DimensionId;
                    compactedDetail.typeValue = detailWithTypeInfo.Value;
                    compactedDetail.DisplayKey = compactedDetail.DisplayKey;

                    switch (systemDimensionIdInHexFormat) {
                    case Dimensions.SYSTEM_ID_ACTOR:
                        compactedDetail.Name = i18n.getProperty("MobAlert_SystemActor_Lbl");
                        compactedDetail.DisplayKey = "MobAlert_SystemActor_Lbl";
                        break;
                    case Dimensions.SYSTEM_ID_INITIATOR:
                        compactedDetail.Name = i18n.getProperty("MobAlert_SystemInit_Lbl");
                        compactedDetail.DisplayKey = "MobAlert_SystemInit_Lbl";
                        break;
                    case Dimensions.SYSTEM_ID_INTERMEDIARY:
                        compactedDetail.Name = i18n.getProperty("MobAlert_SystemIntm_Lbl");
                        compactedDetail.DisplayKey = "MobAlert_SystemIntm_Lbl";
                        break;
                    case Dimensions.SYSTEM_ID_REPORTER:
                        compactedDetail.Name = i18n.getProperty("MobAlert_SystemRepo_Lbl");
                        compactedDetail.DisplayKey = "MobAlert_SystemRepo_Lbl";
                        break;
                    case Dimensions.SYSTEM_ID_TARGET:
                        compactedDetail.Name = i18n.getProperty("MobAlert_SystemTarget_Lbl");
                        compactedDetail.DisplayKey = "MobAlert_SystemTarget_Lbl";
                        break;
                    }
                });
            }
        }

        aDetails.forEach(function(oDetail) {

            switch (controller.oCommons.base64ToHex(oDetail.DimensionId)) {
            case Dimensions.SYSTEM_TYPE_ACTOR:
                addTypeInfo(oDetail, Dimensions.SYSTEM_ID_ACTOR);
                break;
            case Dimensions.SYSTEM_TYPE_INITIATOR:
                addTypeInfo(oDetail, Dimensions.SYSTEM_ID_INITIATOR);
                break;
            case Dimensions.SYSTEM_TYPE_INTERMEDIARY:
                addTypeInfo(oDetail, Dimensions.SYSTEM_ID_INTERMEDIARY);
                break;
            case Dimensions.SYSTEM_TYPE_REPORTER:
                addTypeInfo(oDetail, Dimensions.SYSTEM_ID_REPORTER);
                break;
            case Dimensions.SYSTEM_TYPE_TARGET:
                addTypeInfo(oDetail, Dimensions.SYSTEM_ID_TARGET);
                break;
            }
        });
        detailModel.setData(aCompactedDetails);

    }
};
