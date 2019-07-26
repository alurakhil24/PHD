import React from 'react';

function LiveShareConfirmation(props) {
    return <div class="modal" tabindex="-1" role="dialog" style={{'display': props.show ? 'block' : 'none' }}>
        <div class="modal-dialog" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Modal title</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <p>Modal body text goes here.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" data-dismiss="modal">Accept</button>
                    <button type="button" class="btn btn-secondary" onClick={props.handleDecline}>Decline</button>
                </div>
            </div>
        </div>
    </div>
}

export default LiveShareConfirmation;