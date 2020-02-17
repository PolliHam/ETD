jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");
jQuery.sap.require("sap.secmon.ui.m.commons.Formatter");
jQuery.sap.require("sap.secmon.ui.m.commons.InvestigationCreator");
jQuery.sap.require("sap.ui.model.odata.CountMode");

sap.ui.controller("sap.secmon.ui.m.commons.InvestigationCreatorMenu", {

    // Caution: There are 2 ways to retrieve investigation templates:
    // "/sap/secmon/services/ui/m/invest/investigation.xsodata/InvestigationTemplate" returns all templates (with and without patterns)

    // "/sap/secmon/services/patterndefinitionToAlerts.xsodata/InvestigationTemplates" returns only the investigation templates
    // associated with (any) pattern.
    // One should be careful to use navigation:
    // "/sap/secmon/services/patterndefinitionToAlerts.xsodata/PatternDefinitionAndAlertCountLast24h(X'34A702410BB5164292C3B14AB6098FBA')/InvestigationTemplates"
    // will return the investigation templates with pattern ID = 34A702410BB5164292C3B14AB6098FBA

    INVESTIGATION_SERVICE_URL : "/sap/secmon/services/ui/m/invest/investigation.xsodata",
    TEMPLATE_PATH : "/InvestigationTemplate",
    oCommons : new sap.secmon.ui.commons.CommonFunctions(),
    oDialog : null,
    oEditModel : null,
    aObjects : null,
    fnSelectionCallback : null,
    fnTokenProvider : null,
    oModel : null,

    /**
     * @memberOf sap.secmon.ui.m.commons.InvestigationCreatorMenu
     */
    onInit : function() {
        this.byId("openMenu").attachBrowserEvent("tab keyup", function(oEvent) {
            this._bKeyboard = oEvent.type === "keyup";
        }, this);
    },

    openMenu : function(aPatternIds, oParentView, oButton, fnSelectionCallback) {

        this.fnSelectionCallback = fnSelectionCallback;
        var controller = this;
        if (!this.templateMenu) {
            this.templateMenu = sap.ui.xmlfragment(oParentView.getId(), "sap.secmon.ui.m.commons.InvestigationCreatorMenu", this);
            var i18nModel = new sap.ui.model.resource.ResourceModel({
                bundleUrl : "/sap/secmon/ui/m/commons/i18n/UIText.hdbtextbundle"
            });
            this.templateMenu.setModel(i18nModel, "i18n");

            var i18nModelCommon = new sap.ui.model.resource.ResourceModel({
                bundleUrl : "/sap/secmon/ui/CommonUIText.hdbtextbundle"
            });
            this.templateMenu.setModel(i18nModelCommon, "i18nCommon");
            oParentView.addDependent(this.templateMenu);

            this.oModel = new sap.ui.model.odata.ODataModel(this.INVESTIGATION_SERVICE_URL, {
                json : true,
                defaultCountMode : sap.ui.model.odata.CountMode.Inline
            });
            this.templateMenu.setModel(this.oModel);
            // this.templateListBinding = this.oModel.bindList(this.TEMPLATE_PATH);
            this.oModel.attachRequestFailed(this.oCommons.handleRequestFailed);

            this.oModel.read(this.TEMPLATE_PATH, {
                sorterts : {},
                success : function(response) {
                    controller.saveTemplatesModel(response.results);
                    controller.filterTemplatesModel(aPatternIds);
                }
            });

            this.templatesModel = new sap.ui.model.json.JSONModel();
            this.filteredTemplates = [];
            this.templatesModel.setData(this.filteredTemplates);
            this.templateMenu.setModel(this.templatesModel, "Templates");
        }

        this.filterTemplatesModel(aPatternIds);
        var eDock = sap.ui.core.Popup.Dock;
        this.templateMenu.open(this._bKeyboard, oButton, eDock.BeginTop, eDock.BeginBottom, oButton);
    },

    /**
     * fill the templates model with all templates, then sort templates with matching pattern IDs
     * 
     * @param aPatternIds
     */
    saveTemplatesModel : function(aTemplates) {
        // sort
        this.allTemplates = aTemplates;
        this.allTemplates.sort(function(a, b) {
            if (a.PatternId && b.PatternId) {
                if (a.PatternName > b.PatternName) {
                    return -1;
                } else if (a.PatternName < b.PatternName) {
                    return 1;
                }
                return 0;
            }
            if (a.PatternId) {
                return -1;
            }
            if (b.PatternId) {
                return 1;
            }
            return 0;
        });
        // add flag "bNewPattern" which is used in UI for adding a separator between templates from different patterns
        var prevPatternId;
        this.allTemplates = this.allTemplates.map(function(oTemplate) {
            oTemplate.bNewPattern = prevPatternId !== undefined && oTemplate.PatternId !== prevPatternId;
            prevPatternId = oTemplate.PatternId;
            return oTemplate;
        });
    },

    filterTemplatesModel : function(aPatternIds) {
        var oController = this;

        if (!this.allTemplates) {
            return;
        }
        if (!aPatternIds) {
            return;
        }
        this.filteredTemplates = this.allTemplates.filter(function(oTemplate) {
            return oTemplate.PatternId === null || oTemplate.PatternId.length === 0 || aPatternIds.some(function(patternId) {
                var hex = oController.oCommons.base64ToHex(oTemplate.PatternId);
                var b = (hex === patternId);
                return b;
            });
        });

        this.templatesModel.setData(this.filteredTemplates);
        this.templatesModel.refresh();
    },

    handleFreestyleInvestigation : function(oEvent) {
        // no default values
        this.fnSelectionCallback();
    },

    handleInvestigationFromTemplate : function(oEvent) {
        var item = oEvent.getParameter("item");
        var context = item.getBindingContext("Templates");
        var data = context.getObject();
        var oDefaults = {
            Severity : data.Severity,
            Processor : "",
            Status : "OPEN",
            ManagementVisibility : data.ManagementVisibility,
            Description : data.Description,
            Attack : data.Attack,
            Comment : data.Comment
        };
        this.fnSelectionCallback(oDefaults);
    }

});
