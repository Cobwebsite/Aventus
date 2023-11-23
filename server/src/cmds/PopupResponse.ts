import { Popup } from '../notification/Popup';



export class PopupResponse {
	static cmd: string = "aventus.popupresponse";
	
	public static run(uuid: string, response: string | null){
		Popup.resolve(uuid, response);
	}

}
