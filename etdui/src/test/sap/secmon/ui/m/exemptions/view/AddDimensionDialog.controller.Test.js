describe("AddDimensionDialog.controller Tests", function(){
    jQuery.sap.require({
        modName : "sap.secmon.ui.m.exemptions.view.AddDimensionDialog",
        type : "controller"
    });
    
    var libUnderTest;
    var view, dialog, parentView, messageBox, messageToast, errorHandler, bindingContext, model;
    afterEach(function() {
    });
    beforeEach(function() {
         libUnderTest = sap.ui.controller("sap.secmon.ui.m.exemptions.view.AddDimensionDialog");
         view = jasmine.createSpyObj("view", ["setModel", "byId", "addStyleClass", "getModel", "getController"]);
         dialog = jasmine.createSpyObj("dialog", ["setModel", "open", "close", "focus", "getModel", "getParent"]);
         parentView = jasmine.createSpyObj("parentView", ["getId", "addDependent", "getModel", "byId", "getBindingContext", "getController"]);
         bindingContext = jasmine.createSpyObj("bindingContext", ["getProperty"]);
         model = jasmine.createSpyObj("model", ["getData"]);
         spyOn(libUnderTest, "getView").and.returnValue(view);
         dialog.getParent.and.returnValue(view);
         messageBox = spyOn(sap.m.MessageBox, "show");
         messageToast = spyOn(sap.m.MessageToast, "show");
    });
    it("openDialog Test", function() {
        libUnderTest.oDialog = dialog;
        var namespaceSelect = jasmine.createSpyObj("namespaceSelect", ["removeItem", "bindAggregation"]);
        parentView.byId.and.returnValue(namespaceSelect);
        parentView.getBindingContext.and.returnValue(bindingContext);
        parentView.getModel.and.returnValue(model);
        model.getData.and.returnValue({ Details : [{
            AttributeKey: "56424E801B2FA51BE22A044B51CC7B4A",
            Context: "Log",
            EnumValues: [],
            IsEnum:  false,
            Name: "",
            ValueType: "ValueVarChar"
        }]});
        parentView.getController.and.returnValue({Details : [{
                AttributeKey: "56424E801B2FA51BE22A044B51CC7B4A",
                Context: "Log",
                EnumValues: [],
                IsEnum:  false,
                Name: "",
                ValueType: "ValueVarChar"
            },{
                AttributeKey: "56424E801B2FA51BE22A044B51CC7B4E",
                Context: "Log",
                EnumValues: [],
                IsEnum:  false,
                Name: "",
                ValueType: "ValueVarChar"
            },
            {
                AttributeKey: "56424E801B2FA51BE22A044B51CC7B4B",
                Context: "Log",
                EnumValues: [],
                IsEnum:  false,
                Name: "",
                ValueType: "ValueInteger"
           },{
                AttributeKey: "56424E801B2FA51BE22A044B51CC7B4C",
                Context: "Log",
                EnumValues: [],
                IsEnum:  false, 
                Name: "",
                ValueType: "ValueBigInt"
           }, {
               AttributeKey: "56424E801B2FA51BE22A044B51CC7B4D",
               Context: "Log",
               EnumValues: [],
               IsEnum:  false,
               Name: "",
               ValueType: "ValueDouble"
          }]});
        var callback = function() {};
        libUnderTest.openDialog("2b", parentView, callback);
        expect(libUnderTest.fnSuccessCallback).toBe(callback);
        expect(dialog.setModel).toHaveBeenCalled();
        expect(dialog.open).toHaveBeenCalled();
    });
    it("onDialogClose", function() {
        libUnderTest.oDialog = dialog;
        libUnderTest.onDialogClose();
        expect(dialog.close).toHaveBeenCalled();
    });
    
    xit("onAddDimension", function() {
        libUnderTest.oDialog = dialog;
        var oModel = jasmine.createSpyObj("model", ["getData"]);
        dialog.getModel.and.returnValue(oModel);
        var dimensionSelect = jasmine.createSpyObj("dimensionSelect", ["removeItem"]);
        parentView.byId.and.returnValue(dimensionSelect);
        libUnderTest.onAddDimension.call(libUnderTest);
    });
});