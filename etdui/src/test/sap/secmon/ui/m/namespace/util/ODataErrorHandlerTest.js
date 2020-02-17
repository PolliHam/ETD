
describe("ODataErrorHandlerTest", function(){
	jQuery.sap.require("sap.secmon.ui.m.namespace.util.ODataErrorHandler");
	var spy; 
	var response = {};
	var resourceBundle;
	afterEach(function() {
	});
	beforeEach(function() {
		spy = spyOn(sap.m.MessageBox, "show");
		resourceBundle = jasmine.createSpyObj("resourceBundle", ["getProperty"]);
		resourceBundle.getProperty.and.returnValue("Text");
		response = {};
		
	});
	function setErrorCode(code) {
		return {
			error : {
				innererror : {
					errordetail : {
						intErrorCode : code
					}
				}
			}
		};
	}
	it("test ShowAlert with error code ERR-1", function() {
		response.body = JSON.stringify(setErrorCode("ERR-1"));
		
		sap.secmon.ui.m.namespace.util.ODataErrorHandler.showAlert(response, resourceBundle);
		expect(spy).toHaveBeenCalled();
		expect(spy.calls.argsFor(0)[0]).toEqual("Text");
		expect(spy.calls.argsFor(0)[1].title).toEqual("Text");
		expect(typeof spy.calls.argsFor(0)[1].onClose).toBe("function");
		expect(resourceBundle.getProperty).toHaveBeenCalledWith("NAMESPACE_OD_ERR1");
	});
	it("test ShowAlert with error code ERR-2", function() {
		response.body = JSON.stringify(setErrorCode("ERR-2"));
		
		sap.secmon.ui.m.namespace.util.ODataErrorHandler.showAlert(response, resourceBundle);
		expect(spy).toHaveBeenCalled();
		expect(spy.calls.argsFor(0)[0]).toEqual("Text");
		expect(spy.calls.argsFor(0)[1].title).toEqual("Text");
		expect(typeof spy.calls.argsFor(0)[1].onClose).toBe("function");
		expect(resourceBundle.getProperty).toHaveBeenCalledWith("NAMESPACE_OD_ERR2");
	});
	it("test ShowAlert with error code ERR-3", function() {
		response.body = JSON.stringify(setErrorCode("ERR-3"));
		
		sap.secmon.ui.m.namespace.util.ODataErrorHandler.showAlert(response, resourceBundle);
		expect(spy).toHaveBeenCalled();
		expect(spy.calls.argsFor(0)[0]).toEqual("Text");
		expect(spy.calls.argsFor(0)[1].title).toEqual("Text");
		expect(typeof spy.calls.argsFor(0)[1].onClose).toBe("function");
		expect(resourceBundle.getProperty).toHaveBeenCalledWith("NAMESPACE_OD_ERR3");
	});
	it("test ShowAlert with invalid error code ERR-4", function() {
		response.body = JSON.stringify(setErrorCode("ERR-4"));
		
		sap.secmon.ui.m.namespace.util.ODataErrorHandler.showAlert(response, resourceBundle);
		expect(spy).toHaveBeenCalled();
		expect(spy.calls.argsFor(0)[0]).toEqual("Text");
		expect(spy.calls.argsFor(0)[1].title).toEqual("Text");
		expect(typeof spy.calls.argsFor(0)[1].onClose).toBe("function");
		expect(resourceBundle.getProperty).not.toHaveBeenCalledWith("NAMESPACE_OD_ERR2");
	});
	it("test ShowAlert with invalid json", function() {
		response.body = JSON.stringify(setErrorCode("ERR-2")) + "kjk"; //invalid JSON
		
		sap.secmon.ui.m.namespace.util.ODataErrorHandler.showAlert(response, resourceBundle);
		expect(spy).toHaveBeenCalled();
		expect(spy.calls.argsFor(0)[1].title).toEqual("Text");
		expect(spy.calls.argsFor(0)[0]).toEqual('Response: [\n "body": "[\\"error\\":[\\"innererror\\":[\\"errordetail\\":[\\"intErrorCode\\":\\"ERR-2\\"]]]]kjk"\n]');
		expect(typeof spy.calls.argsFor(0)[1].onClose).toBe("function");
		expect(resourceBundle.getProperty).toHaveBeenCalledWith("NAMESPACE_ERROR");
	});

});
