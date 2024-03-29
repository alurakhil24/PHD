import React from 'react';

function LiveShare(props) {
    return <div>
        <button type="button" class="btn btn-primary" data-toggle="modal" data-target="#exampleModal" onClick={props.getAvailableUsers}>
        Live Share
        </button>
        <div class="modal fade" id="exampleModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalLabel" aria-hidden="true">
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="exampleModalLabel">Available Users</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        {props.usersList}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" onClick={props.handleSend} data-dismiss="modal">Send</button>
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
}

export default LiveShare;