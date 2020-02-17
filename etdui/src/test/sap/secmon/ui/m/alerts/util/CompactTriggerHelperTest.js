jQuery.sap.require("sap.secmon.ui.m.alerts.util.CompactTriggerHelper");
jQuery.sap.require("sap.secmon.ui.commons.CommonFunctions");


describe("CompactTriggerHelper Test", function(){
    var libUnderTest, controller, view, oModel, detailsModel;

    beforeEach(function() {
        libUnderTest = sap.secmon.ui.m.alerts.util.CompactTriggerHelper;
        controller = jasmine.createSpyObj("controller", ["getText", "getView"]);
        controller.oCommons = new sap.secmon.ui.commons.CommonFunctions();
        view = jasmine.createSpyObj("view", ["getModel" ])
        oModel = jasmine.createSpyObj("oModel",["method", "getProperty", "read"]);
        controller.getView.and.returnValue(view);
        view.getModel.and.returnValue(oModel);
        detailsModel = new sap.ui.model.json.JSONModel();
        oModel.getProperty.and.returnValue("Name");
    });
    it("Test compact Details without type information", function() {
        sap.secmon.ui.m.alerts.util.CompactTriggerHelper.compactifyDetails(controller, detailsModel, oModel,"/path");
        expect(oModel.read).toHaveBeenCalled();
        var successHandler = oModel.read.calls.argsFor(0)[1];
        expect(successHandler.hasOwnProperty("success")).toBeTruthy();

        successHandler.success({results : [{"DetailId":"7fJZcvA6CUGclNcP6NLHNg==","AlertId.AlertId":"8MYMAHRuhEGGmSi5enUTtA==","Name":"User Pseudonym, Acting","ValueType":"ValueVarChar","DimensionId":"U9j89Jf7Gy7hAAAACkzxCQ==","Value":"WF-BATCH"}]});
        var data = detailsModel.getData();
        expect(data).not.toBeUndefined();
        expect(data.length).toBe(1);
        expect(data[0].Value).toBe("WF-BATCH");
        expect(data[0].typeValue).toBeUndefined();
        expect(data[0].Name).toBe("User Pseudonym, Acting");
    });
    it("Test compact Details with system type actor", function() {
        sap.secmon.ui.m.alerts.util.CompactTriggerHelper.compactifyDetails(controller, detailsModel, oModel, "/path");
        expect(oModel.read).toHaveBeenCalled();
        var successHandler = oModel.read.calls.argsFor(0)[1];
        expect(successHandler.hasOwnProperty("success")).toBeTruthy();

        successHandler.success({"results":[{"DetailId":"CIs5wTHrVUmYptma8Vnu0g==","AlertId.AlertId":"wksY4jxerEyP0opaAYo+7g==","Name":"System Type, Actor","ValueType":"ValueVarChar","DimensionId":"U83mCw3Fcu7hAAAACkzxCQ==","Value":"ABAP"},
            {"DetailId":"M/vlkKAilEyRHtvc8m4gtg==","AlertId.AlertId":"wksY4jxerEyP0opaAYo+7g==","Name":"System ID, Actor","ValueType":"ValueVarChar","DimensionId":"U83mDQ3Fcu7hAAAACkzxCQ==","Value":"S75/001"}]});
        
        var data = detailsModel.getData();
        expect(data).not.toBeUndefined();
        expect(data.length).toBe(1);
        expect(data[0].Value).toBe("S75/001");
        expect(data[0].typeValue).not.toBeUndefined();
        expect(data[0].Name).not.toBeUndefined();
    });
    
    it("Test compact Details with system type initiator", function() {
        sap.secmon.ui.m.alerts.util.CompactTriggerHelper.compactifyDetails(controller, detailsModel, oModel, "/path");
        expect(oModel.read).toHaveBeenCalled();
        var successHandler = oModel.read.calls.argsFor(0)[1];
        expect(successHandler.hasOwnProperty("success")).toBeTruthy();

        successHandler.success({"results":[{"DetailId":"CIs5wTHrVUmYptma8Vnu0g==","AlertId.AlertId":"wksY4jxerEyP0opaAYo+7g==","Name":"System Type, Initiator","ValueType":"ValueVarChar","DimensionId":"VkJObRsvpRviKgRLUcx7TQ==","Value":"ABAP"},
            {"DetailId":"M/vlkKAilEyRHtvc8m4gtg==","AlertId.AlertId":"wksY4jxerEyP0opaAYo+7g==","Name":"System ID, Initiator","ValueType":"ValueVarChar","DimensionId":"VkJOaxsvpRviKgRLUcx7TQ==","Value":"S75/001"}]});
        
        var data = detailsModel.getData();
        expect(data).not.toBeUndefined();
        expect(data.length).toBe(1);
        expect(data[0].Value).toBe("S75/001");
        expect(data[0].typeValue).not.toBeUndefined();
        expect(data[0].Name).not.toBeUndefined();
    });

    it("Test compact Details with system type intermediary", function() {
        sap.secmon.ui.m.alerts.util.CompactTriggerHelper.compactifyDetails(controller, detailsModel, oModel, "/path");
        expect(oModel.read).toHaveBeenCalled();
        var successHandler = oModel.read.calls.argsFor(0)[1];
        expect(successHandler.hasOwnProperty("success")).toBeTruthy();

        successHandler.success({"results":[{"DetailId":"CIs5wTHrVUmYptma8Vnu0g==","AlertId.AlertId":"wksY4jxerEyP0opaAYo+7g==","Name":"System Type, Intermediary","ValueType":"ValueVarChar","DimensionId":"VkJObhsvpRviKgRLUcx7TQ==","Value":"ABAP"},
            {"DetailId":"M/vlkKAilEyRHtvc8m4gtg==","AlertId.AlertId":"wksY4jxerEyP0opaAYo+7g==","Name":"System ID, Intermediary","ValueType":"ValueVarChar","DimensionId":"VkJObBsvpRviKgRLUcx7TQ==","Value":"S75/001"}]});
        
        var data = detailsModel.getData();
        expect(data).not.toBeUndefined();
        expect(data.length).toBe(1);
        expect(data[0].Value).toBe("S75/001");
        expect(data[0].typeValue).not.toBeUndefined();
        expect(data[0].Name).not.toBeUndefined();
    });

    it("Test compact Details with system type reporter", function() {
        sap.secmon.ui.m.alerts.util.CompactTriggerHelper.compactifyDetails(controller, detailsModel, oModel, "/path");
        expect(oModel.read).toHaveBeenCalled();
        var successHandler = oModel.read.calls.argsFor(0)[1];
        expect(successHandler.hasOwnProperty("success")).toBeTruthy();

        successHandler.success({"results":[{"DetailId":"CIs5wTHrVUmYptma8Vnu0g==","AlertId.AlertId":"wksY4jxerEyP0opaAYo+7g==","Name":"System Type, Reporter","ValueType":"ValueVarChar","DimensionId":"VWx+yVbZrCThAAAACkzxCQ==","Value":"ABAP"},
            {"DetailId":"M/vlkKAilEyRHtvc8m4gtg==","AlertId.AlertId":"wksY4jxerEyP0opaAYo+7g==","Name":"System ID, Reporter","ValueType":"ValueVarChar","DimensionId":"VWx+ylbZrCThAAAACkzxCQ==","Value":"S75/001"}]});
        
        var data = detailsModel.getData();
        expect(data).not.toBeUndefined();
        expect(data.length).toBe(1);
        expect(data[0].Value).toBe("S75/001");
        expect(data[0].typeValue).not.toBeUndefined();
        expect(data[0].Name).not.toBeUndefined();
    });

    it("Test compact Details with system type Target", function() {
        sap.secmon.ui.m.alerts.util.CompactTriggerHelper.compactifyDetails(controller, detailsModel, oModel, "/path");
        expect(oModel.read).toHaveBeenCalled();
        var successHandler = oModel.read.calls.argsFor(0)[1];
        expect(successHandler.hasOwnProperty("success")).toBeTruthy();

        successHandler.success({"results":[{"DetailId":"CIs5wTHrVUmYptma8Vnu0g==","AlertId.AlertId":"wksY4jxerEyP0opaAYo+7g==","Name":"System Type, Target","ValueType":"ValueVarChar","DimensionId":"VBfj1PLlL2bhAAAACkzxCQ==","Value":"ABAP"},
            {"DetailId":"M/vlkKAilEyRHtvc8m4gtg==","AlertId.AlertId":"wksY4jxerEyP0opaAYo+7g==","Name":"System ID, Target","ValueType":"ValueVarChar","DimensionId":"VBfj1/LlL2bhAAAACkzxCQ==","Value":"S75/001"}]});
        
        var data = detailsModel.getData();
        expect(data).not.toBeUndefined();
        expect(data.length).toBe(1);
        expect(data[0].Value).toBe("S75/001");
        expect(data[0].typeValue).not.toBeUndefined();
        expect(data[0].Name).not.toBeUndefined();
    });

    });
