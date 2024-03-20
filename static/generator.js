import { setupConfigExtended } from "./setupExtended.js";
import { MonacoEditorLanguageClientWrapper } from './bundle/index.js';


function getMainCode() {
    let mainCode = `robot Robot

box = Box {
    size = 1, 2, 3
}
`;

    if ( window.localStorage )
    {
        const storedCode = window.localStorage.getItem( 'mainCode' );
        if ( storedCode !== null )
        {
            mainCode = storedCode;
        }
    }

    return mainCode;
}

function onDocumentChange( response ) {

    console.log( 'Document change:', response );

    const commands = JSON.parse( response.content ).$commands;

    console.log( 'Document change:', commands );
}

export const executeExtended = async ( htmlElement ) => {

    const userConfig = setupConfigExtended();
    userConfig.wrapperConfig.editorAppConfig.code = getMainCode();
    const wrapper = new MonacoEditorLanguageClientWrapper();
    await wrapper.initAndStart( userConfig, htmlElement );

    const client = wrapper.getLanguageClient();

    if ( !client )
    {
        throw new Error( 'Unable to obtain language client!' )
    }

    client.onNotification( 'browser/DocumentChange', onDocumentChange );
};
