access(all) contract XuniaIntent {
    access(all) event IntentSubmitted(id: UInt64, action: String)

    access(all) var nextID: UInt64

    init() {
        self.nextID = 0
    }

    access(all) fun submit(action: String): UInt64 {
        let id = self.nextID
        emit IntentSubmitted(id: id, action: action)
        self.nextID = id + 1
        return id
    }
}
